<?php
/**
 * Test page: Google Map
 * Run via: wp eval-file /scripts/setup-google-map-page.php
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

// ── Google Map page ────────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Google Map page ---' );

$slug    = getenv( 'GOOGLE_MAP_PAGE_SLUG' ) ?: 'google-map';
$page_id = ea_upsert_page( $slug, 'Google Map' );

// Shared base — all controls on, basic type with default address.
// The actual map tiles require a Google Maps API key at runtime; tests assert
// on the static HTML container and data-* attributes only.
$base = [
    'eael_google_map_addr'          => 'Marina Bay, Singapore',
    'eael_google_map_zoom'          => '14',
    'eael_map_streeview_control'    => 'true',
    'eael_map_type_control'         => 'yes',
    'eael_map_zoom_control'         => 'yes',
    'eael_map_fullscreen_control'   => 'yes',
    'eael_map_scroll_zoom'          => 'yes',
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Map Types
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Map Types ──', 'h2' ),

    ea_heading( 'Default Google Map (Basic)' ),
    ea_widget( 'test-gm-default', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type' => 'basic',
        ] )
    ),

    ea_heading( 'Google Map | Type: Multiple Marker' ),
    ea_widget( 'test-gm-marker', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type' => 'marker',
        ] )
    ),

    ea_heading( 'Google Map | Type: Static' ),
    ea_widget( 'test-gm-static', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type' => 'static',
        ] )
    ),

    ea_heading( 'Google Map | Type: With Routes' ),
    ea_widget( 'test-gm-routes', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type'               => 'routes',
            'eael_google_map_routes_origin_lat'  => '28.948790',
            'eael_google_map_routes_origin_lng'  => '-81.298843',
            'eael_google_map_routes_dest_lat'    => '28.538336',
            'eael_google_map_routes_dest_lng'    => '-81.379234',
        ] )
    ),

    ea_heading( 'Google Map | Type: Panorama' ),
    ea_widget( 'test-gm-panorama', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type'          => 'panorama',
            'eael_google_map_panorama_lat'  => '28.948790',
            'eael_google_map_panorama_lng'  => '-81.298843',
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Control Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Control Toggles ──', 'h2' ),

    ea_heading( 'Google Map | Zoom Control: Off' ),
    ea_widget( 'test-gm-no-zoom-ctrl', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type'    => 'basic',
            'eael_map_zoom_control'   => '',
        ] )
    ),

    ea_heading( 'Google Map | Fullscreen Control: Off' ),
    ea_widget( 'test-gm-no-fullscreen', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type'          => 'basic',
            'eael_map_fullscreen_control'   => '',
        ] )
    ),

    ea_heading( 'Google Map | Scroll Zoom: Off' ),
    ea_widget( 'test-gm-no-scroll-zoom', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type'    => 'basic',
            'eael_map_scroll_zoom'    => '',
        ] )
    ),

    ea_heading( 'Google Map | Street View: Off' ),
    ea_widget( 'test-gm-no-streetview', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type'          => 'basic',
            'eael_map_streeview_control'    => '',
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Marker Search
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Marker Search ──', 'h2' ),

    ea_heading( 'Google Map | Marker with Search Enabled' ),
    ea_widget( 'test-gm-marker-search', 'eael-google-map',
        array_merge( $base, [
            'eael_google_map_type'  => 'marker',
            'enable_marker_search'  => 'yes',
            'marker_search_text'    => 'Search Marker...',
        ] )
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

WP_CLI::success( 'Google Map page ready → /google-map/' );
