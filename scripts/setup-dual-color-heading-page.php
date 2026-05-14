<?php
/**
 * Test page: Dual Color Heading
 * Run via: wp eval-file /scripts/setup-dual-color-heading-page.php
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

// - Dual Color Heading page --------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Dual Color Heading page ---' );

$slug    = getenv( 'DUAL_COLOR_HEADING_PAGE_SLUG' ) ?: 'dual-color-heading';
$page_id = ea_upsert_page( $slug, 'Dual Color Heading' );

$widgets = [

    // ====================================================================
    // Styles / Layout Types
    // ====================================================================

    ea_heading( '- Styles / Layout Types -', 'h2' ),

    ea_heading( 'Default Dual Color Heading' ),
    ea_widget( 'test-dch-default', 'eael-dual-color-header',
        [
            'eael_dch_first_title' => 'Dual',
            'eael_dch_last_title'  => 'Heading',
        ]
    ),

    ea_heading( 'Style: Icon on Top' ),
    ea_widget( 'test-dch-icon-top', 'eael-dual-color-header',
        [
            'eael_dch_type'        => 'dch-icon-on-top',
            'eael_dch_first_title' => 'Dual',
            'eael_dch_last_title'  => 'Heading',
        ]
    ),

    ea_heading( 'Style: Icon and Sub-text on Top' ),
    ea_widget( 'test-dch-icon-subtext-top', 'eael-dual-color-header',
        [
            'eael_dch_type'        => 'dch-icon-subtext-on-top',
            'eael_dch_first_title' => 'Dual',
            'eael_dch_last_title'  => 'Heading',
        ]
    ),

    ea_heading( 'Style: Sub-text on Top' ),
    ea_widget( 'test-dch-subtext-top', 'eael-dual-color-header',
        [
            'eael_dch_type'        => 'dch-subtext-on-top',
            'eael_dch_first_title' => 'Dual',
            'eael_dch_last_title'  => 'Heading',
        ]
    ),

    // ====================================================================
    // Icon Variants
    // ====================================================================

    ea_heading( '- Icon Variants -', 'h2' ),

    ea_heading( 'Dual Color Heading | Icon: Off' ),
    ea_widget( 'test-dch-icon-off', 'eael-dual-color-header',
        [
            'eael_show_dch_icon_content' => '',
            'eael_dch_first_title'       => 'Dual',
            'eael_dch_last_title'        => 'Heading',
        ]
    ),

    // ====================================================================
    // Separator Variants
    // ====================================================================

    ea_heading( '- Separator Variants -', 'h2' ),

    ea_heading( 'Dual Color Heading | Separator: Line' ),
    ea_widget( 'test-dch-separator', 'eael-dual-color-header',
        [
            'eael_show_dch_separator' => 'yes',
            'eael_dch_separator_type' => 'line',
            'eael_dch_first_title'    => 'Dual',
            'eael_dch_last_title'     => 'Heading',
        ]
    ),

    ea_heading( 'Dual Color Heading | Separator: Icon' ),
    ea_widget( 'test-dch-separator-icon', 'eael-dual-color-header',
        [
            'eael_show_dch_separator' => 'yes',
            'eael_dch_separator_type' => 'icon',
            'eael_dch_separator_icon' => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
            'eael_dch_first_title'    => 'Dual',
            'eael_dch_last_title'     => 'Heading',
        ]
    ),

    // ====================================================================
    // Alignment Variants
    // ====================================================================

    ea_heading( '- Alignment Variants -', 'h2' ),

    ea_heading( 'Dual Color Heading | Align: Left' ),
    ea_widget( 'test-dch-align-left', 'eael-dual-color-header',
        [
            'eael_dch_content_alignment' => 'left',
            'eael_dch_first_title'       => 'Dual',
            'eael_dch_last_title'        => 'Heading',
        ]
    ),

    ea_heading( 'Dual Color Heading | Align: Right' ),
    ea_widget( 'test-dch-align-right', 'eael-dual-color-header',
        [
            'eael_dch_content_alignment' => 'right',
            'eael_dch_first_title'       => 'Dual',
            'eael_dch_last_title'        => 'Heading',
        ]
    ),

    // ====================================================================
    // Multiple Titles Mode
    // ====================================================================

    ea_heading( '- Multiple Titles Mode -', 'h2' ),

    ea_heading( 'Dual Color Heading | Multiple Titles' ),
    ea_widget( 'test-dch-multiple-titles', 'eael-dual-color-header',
        [
            'eael_dch_enable_multiple_titles' => 'yes',
            'eael_dch_multiple_titles'        => [
                [ 'eael_dch_title' => 'Alpha Title' ],
                [ 'eael_dch_title' => 'Beta Title', 'eael_dch_title_color' => '#4d4d4d' ],
                [ 'eael_dch_title' => 'Gamma Title', 'eael_dch_title_use_gradient_color' => 'yes' ],
            ],
        ]
    ),

    // ====================================================================
    // HTML Tag Variants
    // ====================================================================

    ea_heading( '- HTML Tag Variants -', 'h2' ),

    ea_heading( 'Dual Color Heading | Tag: H4' ),
    ea_widget( 'test-dch-tag-h4', 'eael-dual-color-header',
        [
            'title_tag'            => 'h4',
            'eael_dch_first_title' => 'Dual',
            'eael_dch_last_title'  => 'Heading',
        ]
    ),

    // ====================================================================
    // Color Variants
    // ====================================================================

    ea_heading( '- Color Variants -', 'h2' ),

    ea_heading( 'Dual Color Heading | Gradient Color' ),
    ea_widget( 'test-dch-gradient', 'eael-dual-color-header',
        [
            'eael_dch_dual_color_selector'              => 'gradient-color',
            'eael_dch_dual_title_color_gradient_first'  => '#062ACA',
            'eael_dch_dual_title_color_gradient_second' => '#9401D9',
            'eael_dch_first_title'                      => 'Gradient',
            'eael_dch_last_title'                       => 'Heading',
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

WP_CLI::success( 'Dual Color Heading page ready → /' . $slug . '/' );
