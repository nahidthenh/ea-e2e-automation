<?php
/**
 * Test page: Fancy Chart
 * Run via: wp eval-file /scripts/setup-fancy-chart-page.php
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

// - Fancy Chart page ----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Fancy Chart page ---' );

$slug    = getenv( 'FANCY_CHART_PAGE_SLUG' ) ?: 'fancy-chart';
$page_id = ea_upsert_page( $slug, 'Fancy Chart' );

// Shared base — manual data source, title + description present, all toggles on.
// The widget ships with default repeater items for both single and group datasets,
// so no repeater overrides are needed here.
$base = [
    'eael_fancy_chart_title'           => 'Sample Chart Title',
    'eael_fancy_chart_title_tag'       => 'h4',
    'eael_fancy_chart_des'             => 'Sample chart description',
    'eael_fancy_chart_data_option_type' => 'manual',
    'eael_fancy_chart_toolbar_show'    => 'true',
    'eael_fancy_chart_tooltip_enable'  => 'yes',
    'eael_fancy_chart_data_label_enable' => 'yes',
    'eael_fancy_chart_legend_show'     => 'true',
    'eael_fancy_chart_legend_position' => 'top',
];

$widgets = [

    // ====================================================================
    // Chart Styles
    // ====================================================================

    ea_heading( '- Chart Styles -', 'h2' ),

    ea_heading( 'Default Fancy Chart (Bar)' ),
    ea_widget( 'test-fc-default', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'bar',
        ] )
    ),

    ea_heading( 'Fancy Chart | Style: Area' ),
    ea_widget( 'test-fc-area', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'area',
        ] )
    ),

    ea_heading( 'Fancy Chart | Style: Line' ),
    ea_widget( 'test-fc-line', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'line',
        ] )
    ),

    ea_heading( 'Fancy Chart | Style: Radar' ),
    ea_widget( 'test-fc-radar', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'radar',
        ] )
    ),

    ea_heading( 'Fancy Chart | Style: Pie' ),
    ea_widget( 'test-fc-pie', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'pie',
        ] )
    ),

    ea_heading( 'Fancy Chart | Style: Donut' ),
    ea_widget( 'test-fc-donut', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'donut',
        ] )
    ),

    ea_heading( 'Fancy Chart | Style: Polar Area' ),
    ea_widget( 'test-fc-polar', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'polarArea',
        ] )
    ),

    // ====================================================================
    // Title Options
    // ====================================================================

    ea_heading( '- Title Options -', 'h2' ),

    ea_heading( 'Fancy Chart | Title Tag: H2' ),
    ea_widget( 'test-fc-title-h2', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'bar',
            'eael_fancy_chart_title_tag'   => 'h2',
            'eael_fancy_chart_title'       => 'H2 Title Chart',
        ] )
    ),

    // ====================================================================
    // Display Toggles
    // ====================================================================

    ea_heading( '- Display Toggles -', 'h2' ),

    ea_heading( 'Fancy Chart | Legend Hidden' ),
    ea_widget( 'test-fc-no-legend', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style' => 'bar',
            'eael_fancy_chart_legend_show' => '',
        ] )
    ),

    ea_heading( 'Fancy Chart | Toolbar Hidden' ),
    ea_widget( 'test-fc-no-toolbar', 'eael-fancy-chart',
        array_merge( $base, [
            'eael_fancy_chart_chart_style'  => 'bar',
            'eael_fancy_chart_toolbar_show' => '',
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

WP_CLI::success( 'Fancy Chart page ready → /fancy-chart/' );
