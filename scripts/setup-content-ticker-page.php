<?php
/**
 * Test page: Content Ticker
 * Run via: wp eval-file /scripts/setup-content-ticker-page.php
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

// - Content Ticker page ----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Content Ticker page ---' );

$slug    = getenv( 'CONTENT_TICKER_PAGE_SLUG' ) ?: 'content-ticker';
$page_id = ea_upsert_page( $slug, 'Content Ticker' );

$widgets = [

    // ====================================================================
    // Animation & Effect Settings
    // ====================================================================

    ea_heading( '- Animation & Effect Settings -', 'h2' ),

    ea_heading( 'Default Content Ticker' ),
    ea_widget( 'test-ct-default', 'eael-content-ticker',
        [
            'eael_ticker_tag_text' => 'Trending Today',
            'carousel_effect'      => 'slide',
            'autoplay'             => 'yes',
            'arrows'               => 'yes',
            'infinite_loop'        => 'yes',
        ]
    ),

    ea_heading( 'Content Ticker | Effect: Fade' ),
    ea_widget( 'test-ct-effect-fade', 'eael-content-ticker',
        [
            'carousel_effect' => 'fade',
        ]
    ),

    ea_heading( 'Content Ticker | Direction: Right (RTL)' ),
    ea_widget( 'test-ct-direction-right', 'eael-content-ticker',
        [
            'direction' => 'right',
        ]
    ),

    // ====================================================================
    // Navigation & Playback Controls
    // ====================================================================

    ea_heading( '- Navigation & Playback Controls -', 'h2' ),

    ea_heading( 'Content Ticker | Arrows: Off' ),
    ea_widget( 'test-ct-arrows-off', 'eael-content-ticker',
        [
            'arrows' => '',
        ]
    ),

    ea_heading( 'Content Ticker | Autoplay: Disabled' ),
    ea_widget( 'test-ct-autoplay-off', 'eael-content-ticker',
        [
            'autoplay' => '',
        ]
    ),

    ea_heading( 'Content Ticker | Infinite Loop: Off' ),
    ea_widget( 'test-ct-loop-off', 'eael-content-ticker',
        [
            'infinite_loop' => '',
        ]
    ),

    ea_heading( 'Content Ticker | Pause On Hover' ),
    ea_widget( 'test-ct-pause-hover', 'eael-content-ticker',
        [
            'autoplay'       => 'yes',
            'pause_on_hover' => 'yes',
        ]
    ),

    ea_heading( 'Content Ticker | Grab Cursor' ),
    ea_widget( 'test-ct-grab-cursor', 'eael-content-ticker',
        [
            'grab_cursor' => 'yes',
        ]
    ),

    // ====================================================================
    // Tag Variants
    // ====================================================================

    ea_heading( '- Tag Variants -', 'h2' ),

    ea_heading( 'Content Ticker | No Tag Text' ),
    ea_widget( 'test-ct-no-tag', 'eael-content-ticker',
        [
            'eael_ticker_tag_text' => '',
        ]
    ),

    ea_heading( 'Content Ticker | Custom Tag Text' ),
    ea_widget( 'test-ct-custom-tag', 'eael-content-ticker',
        [
            'eael_ticker_tag_text' => 'Latest News',
        ]
    ),

    // ====================================================================
    // Pro: Custom Content
    // ====================================================================

    ea_heading( '- Pro: Custom Content -', 'h2' ),

    ea_heading( 'Content Ticker | Pro: Custom Content Items' ),
    ea_widget( 'test-ct-pro-custom', 'eael-content-ticker',
        [
            'eael_ticker_type'            => 'custom',
            'eael_ticker_tag_text'        => 'Breaking',
            'eael_ticker_custom_contents' => [
                [
                    'eael_ticker_custom_content'      => 'Breaking: New Feature Launched!',
                    'eael_ticker_custom_content_link' => [
                        'url'         => '#feature',
                        'is_external' => '',
                        'nofollow'    => '',
                        'custom_attributes' => '',
                    ],
                ],
                [
                    'eael_ticker_custom_content'      => 'EA Pro Supports Custom Ticker Content',
                    'eael_ticker_custom_content_link' => [
                        'url'         => '#pro',
                        'is_external' => 'on',
                        'nofollow'    => '',
                        'custom_attributes' => '',
                    ],
                ],
                [
                    'eael_ticker_custom_content'      => 'Widget Updates Available Soon',
                    'eael_ticker_custom_content_link' => [
                        'url'         => '#updates',
                        'is_external' => '',
                        'nofollow'    => 'on',
                        'custom_attributes' => '',
                    ],
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

WP_CLI::success( 'Content Ticker page ready → /content-ticker/' );
