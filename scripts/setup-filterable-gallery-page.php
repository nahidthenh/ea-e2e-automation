<?php
/**
 * Test page: Filterable Gallery
 * Run via: wp eval-file /scripts/setup-filterable-gallery-page.php
 */

if ( ! function_exists( 'ea_make_id' ) ) {
    function ea_make_id(): string {
        return substr( md5( uniqid( '', true ) ), 0, 8 );
    }
}
if ( ! function_exists( 'ea_upsert_page' ) ) {
    function ea_upsert_page( string $slug, string $title ): int {
        $existing = get_page_by_path( $slug, OBJECT, 'page' );
        if ( $existing ) {
            WP_CLI::log( "  exists : {$title} (ID {$existing->ID})" );
            update_post_meta( (int) $existing->ID, '_wp_page_template', 'elementor-full-width' );
            return (int) $existing->ID;
        }
        $id = wp_insert_post( [
            'post_type' => 'page', 'post_status' => 'publish',
            'post_title' => $title, 'post_name' => $slug,
        ], true );
        if ( is_wp_error( $id ) ) WP_CLI::error( $id->get_error_message() );
        update_post_meta( $id, '_wp_page_template', 'elementor-full-width' );
        WP_CLI::log( "  created: {$title} (ID {$id})" );
        return (int) $id;
    }
}
if ( ! function_exists( 'ea_widget' ) ) {
    function ea_widget( string $css_class, string $widget_type, array $settings ): array {
        return [
            'id' => ea_make_id(), 'elType' => 'widget', 'widgetType' => $widget_type,
            'settings' => array_merge( [ '_css_classes' => $css_class ], $settings ),
            'elements' => [],
        ];
    }
}
if ( ! function_exists( 'ea_heading' ) ) {
    function ea_heading( string $title, string $tag = 'h4' ): array {
        return [
            'id' => ea_make_id(), 'elType' => 'widget', 'widgetType' => 'heading',
            'settings' => [ 'title' => $title, 'header_size' => $tag ],
            'elements' => [],
        ];
    }
}
if ( ! function_exists( 'ea_build_elementor_data' ) ) {
    function ea_build_elementor_data( array $widgets ): array {
        return [ [
            'id' => ea_make_id(), 'elType' => 'section', 'isInner' => false,
            'settings' => [], 'elements' => [ [
                'id' => ea_make_id(), 'elType' => 'column', 'isInner' => false,
                'settings' => [ '_column_size' => 100 ], 'elements' => $widgets,
            ] ],
        ] ];
    }
}
if ( ! function_exists( 'ea_save_elementor_data' ) ) {
    function ea_save_elementor_data( int $page_id, array $widgets ): void {
        $data = ea_build_elementor_data( $widgets );
        update_post_meta( $page_id, '_elementor_data', wp_json_encode( $data ) );
        update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
        update_post_meta( $page_id, '_elementor_version', '3.0.0' );
        // Delete all render caches so Elementor re-renders from fresh _elementor_data.
        delete_post_meta( $page_id, '_elementor_css' );
        delete_post_meta( $page_id, '_elementor_element_cache' );
        delete_post_meta( $page_id, '_elementor_page_assets' );
    }
}
if ( ! function_exists( 'fg_ensure_placeholder_attachment' ) ) {
    /**
     * Sideloads the EA placeholder PNG into the WP media library once and
     * returns [ 'url' => ..., 'id' => <attachment_id> ].
     * On subsequent calls it reuses the already-imported attachment.
     */
    function fg_ensure_placeholder_attachment(): array {
        $existing = get_posts( [
            'post_type'      => 'attachment',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'meta_key'       => '_eael_fg_placeholder',
        ] );
        if ( $existing ) {
            return [ 'url' => wp_get_attachment_url( $existing[0]->ID ), 'id' => $existing[0]->ID ];
        }

        $src = WP_PLUGIN_DIR . '/essential-addons-for-elementor-lite/assets/front-end/img/eael-default-placeholder.png';
        if ( ! file_exists( $src ) ) {
            return [ 'url' => '', 'id' => 0 ];
        }

        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $upload = wp_upload_bits( 'eael-placeholder.png', null, file_get_contents( $src ) );
        if ( ! empty( $upload['error'] ) ) {
            return [ 'url' => '', 'id' => 0 ];
        }

        $att_id = wp_insert_attachment( [
            'post_mime_type' => 'image/png',
            'post_title'     => 'EA Gallery Placeholder',
            'post_status'    => 'inherit',
        ], $upload['file'] );

        if ( is_wp_error( $att_id ) ) {
            return [ 'url' => $upload['url'], 'id' => 0 ];
        }

        wp_update_attachment_metadata( $att_id, wp_generate_attachment_metadata( $att_id, $upload['file'] ) );
        update_post_meta( $att_id, '_eael_fg_placeholder', '1' );
        return [ 'url' => $upload['url'], 'id' => (int) $att_id ];
    }
}
if ( ! function_exists( 'fg_make_item' ) ) {
    function fg_make_item( string $name, string $filter, string $content, array $img = [] ): array {
        if ( empty( $img ) ) {
            $img = [
                'url' => defined( 'EAEL_PLUGIN_URL' )
                    ? EAEL_PLUGIN_URL . 'assets/front-end/img/eael-default-placeholder.png'
                    : '',
                'id'  => 0,
            ];
        }
        return [
            'eael_fg_gallery_item_name'       => $name,
            'eael_fg_gallery_control_name'    => $filter,
            'eael_fg_gallery_item_content'    => $content,
            'eael_fg_gallery_img'             => $img,
            'eael_fg_gallery_lightbox'        => 'true',
            'eael_fg_gallery_link'            => 'true',
            'eael_fg_gallery_img_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            'fg_video_gallery_switch'         => 'false',
            'eael_fg_gallery_item_video_link' => '',
            'fg_video_gallery_play_icon'      => [ 'url' => '', 'id' => 0 ],
            'fg_item_price_switch'            => 'false',
            'fg_item_price'                   => '',
            'fg_item_ratings_switch'          => 'false',
            'fg_item_ratings'                 => '',
            'fg_item_cat_switch'              => 'false',
            'fg_item_cat'                     => '',
        ];
    }
}

// - Filterable Gallery page ------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Filterable Gallery page ---' );

$slug    = getenv( 'FILTERABLE_GALLERY_PAGE_SLUG' ) ?: 'filterable-gallery';
$page_id = ea_upsert_page( $slug, 'Filterable Gallery' );

// Sideload the EA placeholder PNG into the media library so pro layouts
// (grid_flow_gallery, harmonic_gallery) receive a real attachment ID and
// can render the image correctly.
$placeholder_img       = fg_ensure_placeholder_attachment();
WP_CLI::log( '  img     : placeholder attachment ID ' . $placeholder_img['id'] );

$default_gallery_items = [
    fg_make_item( 'Nature Photo Alpha', 'Nature', 'A scenic nature photograph.', $placeholder_img ),
    fg_make_item( 'City Photo Beta',    'City',   'An urban city photograph.',   $placeholder_img ),
    fg_make_item( 'Nature Photo Gamma', 'Nature', 'Another nature scene.',        $placeholder_img ),
];

$default_controls = [
    [ 'eael_fg_control' => 'Nature', 'eael_fg_control_custom_id' => '', 'eael_fg_custom_label' => '', 'eael_fg_control_active_as_default' => '' ],
    [ 'eael_fg_control' => 'City',   'eael_fg_control_custom_id' => '', 'eael_fg_custom_label' => '', 'eael_fg_control_active_as_default' => '' ],
];

$widgets = [

    // ====================================================================
    // Layout Styles
    // ====================================================================

    ea_heading( '-- Layout Styles --', 'h2' ),

    ea_heading( 'Default Filterable Gallery (Overlay)' ),
    ea_widget( 'test-fg-default', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'       => 'hoverer',
            'eael_fg_grid_style'          => 'grid',
            'eael_fg_grid_hover_style'    => 'eael-slide-up',
            'eael_fg_show_popup'          => 'buttons',
            'filter_enable'               => 'yes',
            'eael_fg_items_to_show'       => 3,
            'eael_fg_all_label_text'      => 'All',
            'eael_fg_controls'            => $default_controls,
            'eael_fg_gallery_items'       => $default_gallery_items,
            'images_per_page'             => 6,
            'nomore_items_text'           => 'No more items!',
        ]
    ),

    ea_heading( 'Filterable Gallery | Layout: Card' ),
    ea_widget( 'test-fg-card', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'   => 'card',
            'eael_fg_items_to_show'   => 3,
            'eael_fg_all_label_text'  => 'All',
            'eael_fg_controls'        => $default_controls,
            'eael_fg_gallery_items'   => $default_gallery_items,
            'images_per_page'         => 6,
            'nomore_items_text'       => 'No more items!',
        ]
    ),

    ea_heading( 'Filterable Gallery | Layout: Search and Filter' ),
    ea_widget( 'test-fg-search', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'   => 'layout_3',
            'eael_fg_items_to_show'   => 3,
            'eael_fg_all_label_text'  => 'All',
            'eael_fg_not_found_text'  => 'No Items Found',
            'eael_fg_controls'        => $default_controls,
            'eael_fg_gallery_items'   => $default_gallery_items,
            'images_per_page'         => 6,
            'nomore_items_text'       => 'No more items!',
        ]
    ),

    // ====================================================================
    // Grid Style
    // ====================================================================

    ea_heading( '-- Grid Style --', 'h2' ),

    ea_heading( 'Filterable Gallery | Grid Style: Masonry' ),
    ea_widget( 'test-fg-masonry', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'   => 'hoverer',
            'eael_fg_grid_style'      => 'masonry',
            'eael_fg_items_to_show'   => 3,
            'eael_fg_all_label_text'  => 'All',
            'eael_fg_controls'        => $default_controls,
            'eael_fg_gallery_items'   => $default_gallery_items,
            'images_per_page'         => 6,
            'nomore_items_text'       => 'No more items!',
        ]
    ),

    // ====================================================================
    // Filter Controls
    // ====================================================================

    ea_heading( '-- Filter Controls --', 'h2' ),

    ea_heading( 'Filterable Gallery | Filter: Disabled' ),
    ea_widget( 'test-fg-filter-off', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'   => 'hoverer',
            'filter_enable'           => '',
            'eael_fg_items_to_show'   => 3,
            'eael_fg_controls'        => $default_controls,
            'eael_fg_gallery_items'   => $default_gallery_items,
            'images_per_page'         => 6,
            'nomore_items_text'       => 'No more items!',
        ]
    ),

    // ====================================================================
    // Hover Style (Overlay Layout)
    // ====================================================================

    ea_heading( '-- Hover Style (Overlay Layout) --', 'h2' ),

    ea_heading( 'Filterable Gallery | Hover: None' ),
    ea_widget( 'test-fg-hover-none', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'    => 'hoverer',
            'eael_fg_grid_hover_style' => 'eael-none',
            'eael_fg_items_to_show'    => 3,
            'eael_fg_controls'         => $default_controls,
            'eael_fg_gallery_items'    => $default_gallery_items,
            'images_per_page'          => 6,
            'nomore_items_text'        => 'No more items!',
        ]
    ),

    ea_heading( 'Filterable Gallery | Hover: Fade In' ),
    ea_widget( 'test-fg-hover-fade', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'    => 'hoverer',
            'eael_fg_grid_hover_style' => 'eael-fade-in',
            'eael_fg_items_to_show'    => 3,
            'eael_fg_controls'         => $default_controls,
            'eael_fg_gallery_items'    => $default_gallery_items,
            'images_per_page'          => 6,
            'nomore_items_text'        => 'No more items!',
        ]
    ),

    ea_heading( 'Filterable Gallery | Hover: Zoom In' ),
    ea_widget( 'test-fg-hover-zoom', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'    => 'hoverer',
            'eael_fg_grid_hover_style' => 'eael-zoom-in',
            'eael_fg_items_to_show'    => 3,
            'eael_fg_controls'         => $default_controls,
            'eael_fg_gallery_items'    => $default_gallery_items,
            'images_per_page'          => 6,
            'nomore_items_text'        => 'No more items!',
        ]
    ),

    // ====================================================================
    // Link / Popup
    // ====================================================================

    ea_heading( '-- Link / Popup --', 'h2' ),

    ea_heading( 'Filterable Gallery | Link To: Media' ),
    ea_widget( 'test-fg-popup-media', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'   => 'hoverer',
            'eael_fg_show_popup'      => 'media',
            'eael_fg_items_to_show'   => 3,
            'eael_fg_controls'        => $default_controls,
            'eael_fg_gallery_items'   => $default_gallery_items,
            'images_per_page'         => 6,
            'nomore_items_text'       => 'No more items!',
        ]
    ),

    ea_heading( 'Filterable Gallery | Link To: None' ),
    ea_widget( 'test-fg-popup-none', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style'   => 'hoverer',
            'eael_fg_show_popup'      => 'none',
            'eael_fg_items_to_show'   => 3,
            'eael_fg_controls'        => $default_controls,
            'eael_fg_gallery_items'   => $default_gallery_items,
            'images_per_page'         => 6,
            'nomore_items_text'       => 'No more items!',
        ]
    ),

    // ====================================================================
    // Pro Layouts (grid_flow_gallery, harmonic_gallery)
    // The free plugin always renders: wrapper + data-layout-mode + filter bar.
    // EA Pro additionally renders the gallery body via do_action hook.
    // Tests assert only the free-plugin structure so CI/CD passes either way.
    // ====================================================================

    ea_heading( '-- Pro Layouts --', 'h2' ),

    ea_heading( 'Filterable Gallery | Pro: Grid Flow' ),
    ea_widget( 'test-fg-pro-grid-flow', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style' => 'grid_flow_gallery',
            'filter_enable'         => 'yes',
            'eael_fg_all_label_text'=> 'All',
            'eael_fg_controls'      => $default_controls,
            'eael_fg_gallery_items' => $default_gallery_items,
            'images_per_page'       => 6,
            'nomore_items_text'     => 'No more items!',
        ]
    ),

    ea_heading( 'Filterable Gallery | Pro: Harmonic' ),
    ea_widget( 'test-fg-pro-harmonic', 'eael-filterable-gallery',
        [
            'eael_fg_caption_style' => 'harmonic_gallery',
            'filter_enable'         => 'yes',
            'eael_fg_all_label_text'=> 'All',
            'eael_fg_controls'      => $default_controls,
            'eael_fg_gallery_items' => $default_gallery_items,
            'images_per_page'       => 6,
            'nomore_items_text'     => 'No more items!',
        ]
    ),

];

ea_save_elementor_data( $page_id, $widgets );
WP_CLI::log( '  widgets : ' . count( $widgets ) . ' nodes written (includes headings)' );

if ( class_exists( '\Elementor\Core\Files\CSS\Post' ) ) {
    ( new \Elementor\Core\Files\CSS\Post( $page_id ) )->update_file();
    WP_CLI::log( '  CSS     : Elementor CSS regenerated for page ' . $page_id );
} elseif ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->files_manager ) ) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    WP_CLI::log( '  CSS     : cache cleared' );
}

WP_CLI::success( 'Filterable Gallery page ready → /' . $slug . '/' );
