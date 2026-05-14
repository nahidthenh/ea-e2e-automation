<?php
/**
 * Test page: Sphere Photo Viewer (360 Degree Photo Viewer)
 * Run via: wp eval-file /scripts/setup-sphere-photo-viewer-page.php
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
        update_post_meta( $page_id, '_elementor_data', wp_slash( wp_json_encode( $data ) ) );
        update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
        update_post_meta( $page_id, '_elementor_version', '3.0.0' );
        delete_post_meta( $page_id, '_elementor_css' );
    }
}

// - Sphere Photo Viewer page ------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Sphere Photo Viewer page ---' );

$slug    = getenv( 'SPHERE_PHOTO_VIEWER_PAGE_SLUG' ) ?: 'sphere-photo-viewer';
$page_id = ea_upsert_page( $slug, 'Sphere Photo Viewer' );

// Shared 360-degree placeholder image (public, no auth required)
$panorama_url = 'https://app.essential-addons.com/360-photo-viewer/placeholder.jpeg';

$widgets = [

    // ====================================================================
    // Content Variants
    // ====================================================================

    ea_heading( '- Content Variants -', 'h2' ),

    ea_heading( 'Default Sphere Photo Viewer' ),
    ea_widget( 'test-spv-default', 'eael-sphere-photo-viewer',
        [
            'ea_spv_image'              => [ 'url' => $panorama_url, 'id' => '' ],
            'ea_spv_caption_switch'     => 'yes',
            'ea_spv_caption'            => 'Panoramic View',
            'ea_spv_description_switch' => 'yes',
            'ea_spv_description'        => '<p>Default 360 photo viewer with caption and description.</p>',
        ]
    ),

    ea_heading( 'Sphere Photo Viewer | No Caption' ),
    ea_widget( 'test-spv-no-caption', 'eael-sphere-photo-viewer',
        [
            'ea_spv_image'              => [ 'url' => $panorama_url, 'id' => '' ],
            'ea_spv_caption_switch'     => '',
            'ea_spv_description_switch' => 'yes',
            'ea_spv_description'        => '<p>Description only, no caption.</p>',
        ]
    ),

    ea_heading( 'Sphere Photo Viewer | No Description' ),
    ea_widget( 'test-spv-no-description', 'eael-sphere-photo-viewer',
        [
            'ea_spv_image'              => [ 'url' => $panorama_url, 'id' => '' ],
            'ea_spv_caption_switch'     => 'yes',
            'ea_spv_caption'            => 'Caption Only',
            'ea_spv_description_switch' => '',
        ]
    ),

    // ====================================================================
    // Settings Variants
    // ====================================================================

    ea_heading( '- Settings Variants -', 'h2' ),

    ea_heading( 'Sphere Photo Viewer | Auto-Rotation: On' ),
    ea_widget( 'test-spv-autorotate', 'eael-sphere-photo-viewer',
        [
            'ea_spv_image'               => [ 'url' => $panorama_url, 'id' => '' ],
            'ea_spv_caption_switch'      => '',
            'ea_spv_description_switch'  => '',
            'ea_spv_autorotate_switch'   => 'yes',
            'ea_spv_autorotate_speed'    => [ 'size' => 0.5 ],
            'ea_spv_autorotate_delay'    => [ 'size' => 500 ],
        ]
    ),

    ea_heading( 'Sphere Photo Viewer | Fisheye Effect: On' ),
    ea_widget( 'test-spv-fisheye', 'eael-sphere-photo-viewer',
        [
            'ea_spv_image'              => [ 'url' => $panorama_url, 'id' => '' ],
            'ea_spv_caption_switch'     => '',
            'ea_spv_description_switch' => '',
            'ea_spv_fisheye'            => 'yes',
        ]
    ),

    // ====================================================================
    // Navigation Bar
    // ====================================================================

    ea_heading( '- Navigation Bar -', 'h2' ),

    ea_heading( 'Sphere Photo Viewer | Navbar: Hidden' ),
    ea_widget( 'test-spv-navbar-hidden', 'eael-sphere-photo-viewer',
        [
            'ea_spv_image'                => [ 'url' => $panorama_url, 'id' => '' ],
            'ea_spv_caption_switch'       => '',
            'ea_spv_description_switch'   => '',
            'ea_spv_navbar_visibility'    => 'none',
        ]
    ),

    // ====================================================================
    // Markers
    // ====================================================================

    ea_heading( '- Markers -', 'h2' ),

    ea_heading( 'Sphere Photo Viewer | With Markers' ),
    ea_widget( 'test-spv-markers', 'eael-sphere-photo-viewer',
        [
            'ea_spv_image'              => [ 'url' => $panorama_url, 'id' => '' ],
            'ea_spv_caption_switch'     => '',
            'ea_spv_description_switch' => '',
            'ea_spv_markers_switch'     => 'yes',
            'ea_spv_markers_list'       => [
                [
                    'ea_spv_markers_tooltip' => 'Point Alpha',
                    'ea_spv_markers_content' => 'Details about Point Alpha.',
                    'left_position'          => [ 'size' => 30,  'unit' => 'px' ],
                    'top_position'           => [ 'size' => 10,  'unit' => 'px' ],
                    'ea_spv_markers_img'     => [ 'url' => '', 'id' => '' ],
                    'custom_dimension'       => [ 'width' => '32', 'height' => '32' ],
                ],
                [
                    'ea_spv_markers_tooltip' => 'Point Beta',
                    'ea_spv_markers_content' => 'Details about Point Beta.',
                    'left_position'          => [ 'size' => -60, 'unit' => 'px' ],
                    'top_position'           => [ 'size' => 5,   'unit' => 'px' ],
                    'ea_spv_markers_img'     => [ 'url' => '', 'id' => '' ],
                    'custom_dimension'       => [ 'width' => '32', 'height' => '32' ],
                ],
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

WP_CLI::success( 'Sphere Photo Viewer page ready → /sphere-photo-viewer/' );
