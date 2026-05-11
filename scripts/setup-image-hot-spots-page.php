<?php
/**
 * Test page: Image Hot Spots
 * Run via: wp eval-file /scripts/setup-image-hot-spots-page.php
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

// ── Image Hot Spots page ───────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Image Hot Spots page ---' );

$slug    = getenv( 'IMAGE_HOT_SPOTS_PAGE_SLUG' ) ?: 'image-hot-spots';
$page_id = ea_upsert_page( $slug, 'Image Hot Spots' );

// Import a placeholder image so Elementor's MEDIA control has a real attachment ID.
$placeholder_src = WP_PLUGIN_DIR
    . '/essential-addons-for-elementor-lite/assets/front-end/img/accordion.png';
if ( ! file_exists( $placeholder_src ) ) {
    $placeholder_src = WP_PLUGIN_DIR
        . '/essential-addons-elementor/assets/front-end/img/accordion.png';
}

$existing = get_posts( [
    'post_type'   => 'attachment',
    'meta_key'    => '_ea_ihs_placeholder',
    'meta_value'  => '1',
    'fields'      => 'ids',
    'numberposts' => 1,
] );

if ( $existing ) {
    $ea_img_id  = (int) $existing[0];
    $ea_img_url = wp_get_attachment_url( $ea_img_id );
    WP_CLI::log( "  image   : reusing attachment ID {$ea_img_id}" );
} elseif ( file_exists( $placeholder_src ) ) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $tmp = wp_tempnam( 'ihs-placeholder.png' );
    copy( $placeholder_src, $tmp );
    $file_array = [ 'name' => 'ihs-placeholder.png', 'tmp_name' => $tmp ];
    $ea_img_id  = media_handle_sideload( $file_array, 0, 'EA Image Hot Spots Placeholder' );
    if ( is_wp_error( $ea_img_id ) ) {
        WP_CLI::error( 'Could not import image: ' . $ea_img_id->get_error_message() );
    }
    update_post_meta( $ea_img_id, '_ea_ihs_placeholder', '1' );
    $ea_img_url = wp_get_attachment_url( $ea_img_id );
    WP_CLI::log( "  image   : imported as attachment ID {$ea_img_id} → {$ea_img_url}" );
} else {
    $ea_img_id  = 0;
    $ea_img_url = includes_url( 'images/media/default.png' );
    WP_CLI::log( "  image   : using WP default placeholder (no attachment)" );
}

$ihs_img = [ 'url' => $ea_img_url, 'id' => $ea_img_id ];

// Default hotspot item (icon, no tooltip)
function ihs_item( array $overrides = [] ): array {
    return array_merge( [
        'hotspot_type'           => 'icon',
        'hotspot_icon_new'       => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        'hotspot_text'           => 'Hotspot',
        'hotspot_link'           => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'hotspot_link_target'    => '',
        'left_position'          => [ 'size' => 25, 'unit' => 'px' ],
        'top_position'           => [ 'size' => 30, 'unit' => 'px' ],
        'tooltip'                => '',
        'tooltip_position_local' => 'global',
        'tooltip_content'        => 'Tooltip Content',
    ], $overrides );
}

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Hotspot Types
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Hotspot Types ──', 'h2' ),

    ea_heading( 'Default Image Hot Spots (icon type, glow on)' ),
    ea_widget( 'test-ihs-default', 'eael-image-hotspots',
        [
            'image'         => $ihs_img,
            'hot_spots'     => [ ihs_item( [ 'hotspot_text' => 'Hotspot 1' ] ) ],
            'hotspot_pulse' => 'yes',
        ]
    ),

    ea_heading( 'Image Hot Spots | Type: Text' ),
    ea_widget( 'test-ihs-type-text', 'eael-image-hotspots',
        [
            'image'     => $ihs_img,
            'hot_spots' => [
                ihs_item( [
                    'hotspot_type' => 'text',
                    'hotspot_text' => 'Info',
                ] ),
            ],
        ]
    ),

    ea_heading( 'Image Hot Spots | Type: Blank' ),
    ea_widget( 'test-ihs-type-blank', 'eael-image-hotspots',
        [
            'image'     => $ihs_img,
            'hot_spots' => [
                ihs_item( [
                    'hotspot_type' => 'blank',
                    'hotspot_text' => '',
                ] ),
            ],
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Tooltip
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Tooltip ──', 'h2' ),

    ea_heading( 'Image Hot Spots | Tooltip: Enabled (position top)' ),
    ea_widget( 'test-ihs-tooltip', 'eael-image-hotspots',
        [
            'image'            => $ihs_img,
            'hot_spots'        => [
                ihs_item( [
                    'hotspot_text'    => 'Hover me',
                    'tooltip'         => 'yes',
                    'tooltip_content' => 'This is tooltip text',
                ] ),
            ],
            'tooltip_position' => 'top',
            'tooltip_arrow'    => 'yes',
            'tooltip_size'     => 'default',
        ]
    ),

    ea_heading( 'Image Hot Spots | Tooltip: Bottom position (local)' ),
    ea_widget( 'test-ihs-tooltip-bottom', 'eael-image-hotspots',
        [
            'image'            => $ihs_img,
            'hot_spots'        => [
                ihs_item( [
                    'hotspot_text'           => 'Bottom tip',
                    'tooltip'                => 'yes',
                    'tooltip_position_local' => 'bottom',
                    'tooltip_content'        => 'Bottom tooltip',
                ] ),
            ],
            'tooltip_position' => 'top',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Glow Effect
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Glow Effect ──', 'h2' ),

    ea_heading( 'Image Hot Spots | Glow Effect: Off' ),
    ea_widget( 'test-ihs-pulse-off', 'eael-image-hotspots',
        [
            'image'         => $ihs_img,
            'hot_spots'     => [ ihs_item() ],
            'hotspot_pulse' => '',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Link Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Link Variants ──', 'h2' ),

    ea_heading( 'Image Hot Spots | External Link (target=_blank)' ),
    ea_widget( 'test-ihs-link-external', 'eael-image-hotspots',
        [
            'image'     => $ihs_img,
            'hot_spots' => [
                ihs_item( [
                    'hotspot_text'        => 'External',
                    'hotspot_link'        => [ 'url' => 'https://example.com', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ],
                    'hotspot_link_target' => 'yes',
                ] ),
            ],
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Image Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Image Alignment ──', 'h2' ),

    ea_heading( 'Image Hot Spots | Alignment: Left' ),
    ea_widget( 'test-ihs-align-left', 'eael-image-hotspots',
        [
            'image'           => $ihs_img,
            'hot_spots'       => [ ihs_item() ],
            'image_alignment' => 'left',
        ]
    ),

    ea_heading( 'Image Hot Spots | Alignment: Right' ),
    ea_widget( 'test-ihs-align-right', 'eael-image-hotspots',
        [
            'image'           => $ihs_img,
            'hot_spots'       => [ ihs_item() ],
            'image_alignment' => 'right',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Multiple Hotspots
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Multiple Hotspots ──', 'h2' ),

    ea_heading( 'Image Hot Spots | 3 Hotspots (mixed types)' ),
    ea_widget( 'test-ihs-multi', 'eael-image-hotspots',
        [
            'image'     => $ihs_img,
            'hot_spots' => [
                ihs_item( [
                    'hotspot_type' => 'icon',
                    'hotspot_text' => 'Alpha',
                    'left_position' => [ 'size' => 20, 'unit' => 'px' ],
                    'top_position'  => [ 'size' => 25, 'unit' => 'px' ],
                ] ),
                ihs_item( [
                    'hotspot_type' => 'text',
                    'hotspot_text' => 'Beta',
                    'left_position' => [ 'size' => 50, 'unit' => 'px' ],
                    'top_position'  => [ 'size' => 50, 'unit' => 'px' ],
                ] ),
                ihs_item( [
                    'hotspot_type' => 'icon',
                    'hotspot_text' => 'Gamma',
                    'left_position' => [ 'size' => 75, 'unit' => 'px' ],
                    'top_position'  => [ 'size' => 70, 'unit' => 'px' ],
                ] ),
            ],
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

WP_CLI::success( 'Image Hot Spots page ready → /' . $slug . '/' );
