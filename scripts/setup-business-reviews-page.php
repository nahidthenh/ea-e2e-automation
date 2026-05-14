<?php
/**
 * Test page: Business Reviews
 * Run via: wp eval-file /scripts/setup-business-reviews-page.php
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
            return (int) $existing->ID;
        }
        $id = wp_insert_post( [
            'post_type' => 'page', 'post_status' => 'publish',
            'post_title' => $title, 'post_name' => $slug,
        ], true );
        if ( is_wp_error( $id ) ) WP_CLI::error( $id->get_error_message() );
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

// - Business Reviews page -------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Business Reviews page ---' );

// Store the Google Places API key in the WordPress option that the widget reads.
$api_key  = getenv( 'GOOGLE_BUSINESS_NEW_API' ) ?: '';
$place_id = getenv( 'GOOGLE_BUSINESS_PLACE_ID' ) ?: '';

if ( empty( $api_key ) ) {
    WP_CLI::warning( 'GOOGLE_BUSINESS_NEW_API is not set — widget will show an error message.' );
}
if ( empty( $place_id ) ) {
    WP_CLI::warning( 'GOOGLE_BUSINESS_PLACE_ID is not set — widget will show an error message.' );
}

update_option( 'eael_br_google_place_api_key', $api_key );
WP_CLI::log( '  API key : stored in eael_br_google_place_api_key' );

$slug    = getenv( 'BUSINESS_REVIEWS_PAGE_SLUG' ) ?: 'business-reviews';
$page_id = ea_upsert_page( $slug, 'Business Reviews' );

// Shared settings injected into every widget instance.
$base = [
    'eael_business_reviews_sources'          => 'google-reviews',
    'eael_business_reviews_google_api_type'  => 'places-new',
    'eael_business_reviews_business_place_id'=> $place_id,
    'eael_business_reviews_data_cache_time'  => 1440, // cache 24 h so tests never hammer the API
];

$widgets = [

    // ====================================================================
    // Slider Layout — Presets
    // ====================================================================

    ea_heading( '- Slider Layout -', 'h2' ),

    ea_heading( 'Business Reviews | Slider Preset 1 (default)' ),
    ea_widget( 'test-br-default', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-1',
            'eael_business_reviews_arrows'               => 'yes',
            'eael_business_reviews_dots'                 => 'yes',
            'eael_business_reviews_autoplay'             => 'yes',
        ] )
    ),

    ea_heading( 'Business Reviews | Slider Preset 2' ),
    ea_widget( 'test-br-slider-p2', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-2',
            'eael_business_reviews_arrows'               => 'yes',
            'eael_business_reviews_dots'                 => 'yes',
        ] )
    ),

    ea_heading( 'Business Reviews | Slider Preset 3' ),
    ea_widget( 'test-br-slider-p3', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-3',
            'eael_business_reviews_arrows'               => 'yes',
            'eael_business_reviews_dots'                 => 'yes',
        ] )
    ),

    ea_heading( 'Business Reviews | Slider — No Arrows' ),
    ea_widget( 'test-br-no-arrows', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-1',
            'eael_business_reviews_arrows'               => '',
            'eael_business_reviews_dots'                 => 'yes',
        ] )
    ),

    ea_heading( 'Business Reviews | Slider — No Dots' ),
    ea_widget( 'test-br-no-dots', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-1',
            'eael_business_reviews_arrows'               => 'yes',
            'eael_business_reviews_dots'                 => '',
        ] )
    ),

    // ====================================================================
    // Grid Layout — Presets
    // ====================================================================

    ea_heading( '- Grid Layout -', 'h2' ),

    ea_heading( 'Business Reviews | Grid Preset 1' ),
    ea_widget( 'test-br-grid', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'        => 'grid',
            'eael_business_reviews_style_preset_grid'   => 'preset-1',
        ] )
    ),

    ea_heading( 'Business Reviews | Grid Preset 2' ),
    ea_widget( 'test-br-grid-p2', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'        => 'grid',
            'eael_business_reviews_style_preset_grid'   => 'preset-2',
        ] )
    ),

    ea_heading( 'Business Reviews | Grid Preset 3' ),
    ea_widget( 'test-br-grid-p3', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'        => 'grid',
            'eael_business_reviews_style_preset_grid'   => 'preset-3',
        ] )
    ),

    // ====================================================================
    // Content Toggles
    // ====================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'Business Reviews | No Reviewer Avatar' ),
    ea_widget( 'test-br-no-avatar', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-1',
            'eael_business_reviews_reviewer_photo'       => '',
        ] )
    ),

    ea_heading( 'Business Reviews | No Review Text' ),
    ea_widget( 'test-br-no-text', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-1',
            'eael_business_reviews_review_text'          => '',
        ] )
    ),

    ea_heading( 'Business Reviews | No Review Time' ),
    ea_widget( 'test-br-no-time', 'eael-business-reviews',
        array_merge( $base, [
            'eael_business_reviews_items_layout'         => 'slider',
            'eael_business_reviews_style_preset_slider'  => 'preset-1',
            'eael_business_reviews_review_time'          => '',
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

WP_CLI::success( 'Business Reviews page ready → /' . $slug . '/' );
