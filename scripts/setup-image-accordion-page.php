<?php
/**
 * Test page: Image Accordion
 * Run via: wp eval-file /scripts/setup-image-accordion-page.php
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
        delete_post_meta( $page_id, '_elementor_css' );
    }
}

// - Image Accordion page --------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Image Accordion page ---' );

$slug    = getenv( 'IMAGE_ACCORDION_PAGE_SLUG' ) ?: 'image-accordion';
$page_id = ea_upsert_page( $slug, 'Image Accordion' );

// Import the plugin's bundled accordion image into the media library so
// Elementor's MEDIA control sanitizer has a real attachment ID to validate.
// (A bare URL with id=0 gets stripped at render time.)
$ea_accordion_src = WP_PLUGIN_DIR
    . '/essential-addons-for-elementor-lite/assets/front-end/img/accordion.png';
$existing = get_posts( [
    'post_type'  => 'attachment',
    'meta_key'   => '_ea_accordion_placeholder',
    'meta_value' => '1',
    'fields'     => 'ids',
    'numberposts' => 1,
] );
if ( $existing ) {
    $ea_img_id  = (int) $existing[0];
    $ea_img_url = wp_get_attachment_url( $ea_img_id );
    WP_CLI::log( "  image   : reusing attachment ID {$ea_img_id}" );
} else {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $tmp = wp_tempnam( 'accordion.png' );
    copy( $ea_accordion_src, $tmp );
    $_FILES['ea_accordion_img'] = [
        'name'     => 'accordion.png',
        'type'     => 'image/png',
        'tmp_name' => $tmp,
        'error'    => 0,
        'size'     => filesize( $tmp ),
    ];
    $ea_img_id = media_handle_upload( 'ea_accordion_img', 0, [
        'post_title' => 'EA Image Accordion Placeholder',
    ] );
    if ( is_wp_error( $ea_img_id ) ) {
        // Fallback: sideload directly
        $file_array = [ 'name' => 'accordion.png', 'tmp_name' => $tmp ];
        $ea_img_id  = media_handle_sideload( $file_array, 0, 'EA Image Accordion Placeholder' );
    }
    if ( is_wp_error( $ea_img_id ) ) {
        WP_CLI::error( 'Could not import accordion image: ' . $ea_img_id->get_error_message() );
    }
    update_post_meta( $ea_img_id, '_ea_accordion_placeholder', '1' );
    $ea_img_url = wp_get_attachment_url( $ea_img_id );
    WP_CLI::log( "  image   : imported as attachment ID {$ea_img_id} → {$ea_img_url}" );
}
$eael_accordion_img_bg = [ 'url' => $ea_img_url, 'id' => $ea_img_id ];

// Shared helper: 3 items with distinct verifiable titles
function ia_items( array $img_bg, array $overrides = [] ): array {
    $bg = $img_bg;
    $base = [
        [
            'eael_accordion_tittle'            => 'City Lights',
            'eael_accordion_content'           => 'Explore vibrant city scenes at night.',
            'eael_accordion_bg'                => $bg,
            'eael_accordion_is_active'         => '',
            'eael_accordion_enable_title_link' => 'yes',
            'eael_accordion_title_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        ],
        [
            'eael_accordion_tittle'            => 'Ocean Breeze',
            'eael_accordion_content'           => 'Relax with the sound of waves.',
            'eael_accordion_bg'                => $bg,
            'eael_accordion_is_active'         => '',
            'eael_accordion_enable_title_link' => 'yes',
            'eael_accordion_title_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        ],
        [
            'eael_accordion_tittle'            => 'Mountain Peak',
            'eael_accordion_content'           => 'Reach new heights of adventure.',
            'eael_accordion_bg'                => $bg,
            'eael_accordion_is_active'         => '',
            'eael_accordion_enable_title_link' => 'yes',
            'eael_accordion_title_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        ],
    ];

    foreach ( $overrides as $idx => $patch ) {
        $base[ $idx ] = array_merge( $base[ $idx ], $patch );
    }

    return $base;
}

$widgets = [

    // ====================================================================
    // Accordion Type (on-hover / on-click)
    // ====================================================================

    ea_heading( '- Accordion Type -', 'h2' ),

    ea_heading( 'Default Image Accordion (on-hover, horizontal)' ),
    ea_widget( 'test-ia-default', 'eael-image-accordion',
        [
            'eael_img_accordion_type'      => 'on-hover',
            'eael_img_accordion_direction' => 'accordion-direction-horizontal',
            'eael_img_accordions'          => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    ea_heading( 'Image Accordion | Type: On Click' ),
    ea_widget( 'test-ia-on-click', 'eael-image-accordion',
        [
            'eael_img_accordion_type'      => 'on-click',
            'eael_img_accordion_direction' => 'accordion-direction-horizontal',
            'eael_img_accordions'          => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    // ====================================================================
    // Direction
    // ====================================================================

    ea_heading( '- Direction -', 'h2' ),

    ea_heading( 'Image Accordion | Direction: Vertical' ),
    ea_widget( 'test-ia-vertical', 'eael-image-accordion',
        [
            'eael_img_accordion_type'      => 'on-hover',
            'eael_img_accordion_direction' => 'accordion-direction-vertical',
            'eael_img_accordions'          => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    // ====================================================================
    // Content Alignment
    // ====================================================================

    ea_heading( '- Content Alignment -', 'h2' ),

    ea_heading( 'Image Accordion | Horizontal Align: Left' ),
    ea_widget( 'test-ia-halign-left', 'eael-image-accordion',
        [
            'eael_img_accordion_content_horizontal_align' => 'left',
            'eael_img_accordions'                         => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    ea_heading( 'Image Accordion | Horizontal Align: Right' ),
    ea_widget( 'test-ia-halign-right', 'eael-image-accordion',
        [
            'eael_img_accordion_content_horizontal_align' => 'right',
            'eael_img_accordions'                         => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    ea_heading( 'Image Accordion | Vertical Align: Top' ),
    ea_widget( 'test-ia-valign-top', 'eael-image-accordion',
        [
            'eael_img_accordion_content_vertical_align' => 'top',
            'eael_img_accordions'                       => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    ea_heading( 'Image Accordion | Vertical Align: Bottom' ),
    ea_widget( 'test-ia-valign-bottom', 'eael-image-accordion',
        [
            'eael_img_accordion_content_vertical_align' => 'bottom',
            'eael_img_accordions'                       => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    // ====================================================================
    // Active Item
    // ====================================================================

    ea_heading( '- Active Item -', 'h2' ),

    ea_heading( 'Image Accordion | First Item Active' ),
    ea_widget( 'test-ia-active-item', 'eael-image-accordion',
        [
            'eael_img_accordions' => ia_items( $eael_accordion_img_bg, [
                0 => [ 'eael_accordion_is_active' => 'yes' ],
            ] ),
        ]
    ),

    // ====================================================================
    // Link Variants
    // ====================================================================

    ea_heading( '- Link Variants -', 'h2' ),

    ea_heading( 'Image Accordion | External Link (target=_blank)' ),
    ea_widget( 'test-ia-link-external', 'eael-image-accordion',
        [
            'eael_img_accordions' => ia_items( $eael_accordion_img_bg, [
                0 => [
                    'eael_accordion_enable_title_link' => 'yes',
                    'eael_accordion_title_link'        => [
                        'url'         => 'https://example.com',
                        'is_external' => 'on',
                        'nofollow'    => '',
                        'custom_attributes' => '',
                    ],
                ],
            ] ),
        ]
    ),

    ea_heading( 'Image Accordion | Nofollow Link' ),
    ea_widget( 'test-ia-link-nofollow', 'eael-image-accordion',
        [
            'eael_img_accordions' => ia_items( $eael_accordion_img_bg, [
                0 => [
                    'eael_accordion_enable_title_link' => 'yes',
                    'eael_accordion_title_link'        => [
                        'url'         => 'https://example.com',
                        'is_external' => '',
                        'nofollow'    => 'on',
                        'custom_attributes' => '',
                    ],
                ],
            ] ),
        ]
    ),

    ea_heading( 'Image Accordion | Link Disabled' ),
    ea_widget( 'test-ia-link-disabled', 'eael-image-accordion',
        [
            'eael_img_accordions' => ia_items( $eael_accordion_img_bg, [
                0 => [ 'eael_accordion_enable_title_link' => '' ],
            ] ),
        ]
    ),

    // ====================================================================
    // Title Tag
    // ====================================================================

    ea_heading( '- Title Tag -', 'h2' ),

    ea_heading( 'Image Accordion | Title Tag: H3' ),
    ea_widget( 'test-ia-title-h3', 'eael-image-accordion',
        [
            'title_tag'           => 'h3',
            'eael_img_accordions' => ia_items( $eael_accordion_img_bg ),
        ]
    ),

    ea_heading( 'Image Accordion | Title Tag: Span' ),
    ea_widget( 'test-ia-title-span', 'eael-image-accordion',
        [
            'title_tag'           => 'span',
            'eael_img_accordions' => ia_items( $eael_accordion_img_bg ),
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

WP_CLI::success( 'Image Accordion page ready → /' . $slug . '/' );
