<?php
/**
 * Test page: Progress Bar
 * Run via: wp eval-file /scripts/setup-progress-bar-page.php
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
        update_post_meta( $page_id, '_elementor_data', wp_json_encode( $data ) );
        update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
        update_post_meta( $page_id, '_elementor_version', '3.0.0' );
        delete_post_meta( $page_id, '_elementor_css' );
    }
}

// ── Progress Bar page ─────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Progress Bar page ---' );

$slug    = getenv( 'PROGRESS_BAR_PAGE_SLUG' ) ?: 'progress-bar';
$page_id = ea_upsert_page( $slug, 'Progress Bar' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Free Layouts
    // line, circle, half_circle are available in free mode.
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Free Layouts ──', 'h2' ),

    ea_heading( 'Default Progress Bar (Line)' ),
    ea_widget( 'test-pb-default', 'eael-progress-bar', [
        'progress_bar_layout'     => 'line',
        'progress_bar_title'      => 'Progress Bar',
        'progress_bar_value'      => [ 'unit' => '%', 'size' => 50 ],
        'progress_bar_show_count' => 'yes',
    ] ),

    ea_heading( 'Progress Bar | Circle Layout' ),
    ea_widget( 'test-pb-circle', 'eael-progress-bar', [
        'progress_bar_layout' => 'circle',
        'progress_bar_title'  => 'Progress Bar',
        'progress_bar_value'  => [ 'unit' => '%', 'size' => 75 ],
        'progress_bar_show_count' => 'yes',
    ] ),

    ea_heading( 'Progress Bar | Half Circle Layout' ),
    ea_widget( 'test-pb-half-circle', 'eael-progress-bar', [
        'progress_bar_layout'        => 'half_circle',
        'progress_bar_title'         => 'Progress Bar',
        'progress_bar_value'         => [ 'unit' => '%', 'size' => 60 ],
        'progress_bar_show_count'    => 'yes',
        'progress_bar_prefix_label'  => 'Start',
        'progress_bar_postfix_label' => 'End',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Pro Layouts
    // Falls back to line layout when pro is not enabled.
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Pro Layouts ──', 'h2' ),

    ea_heading( 'Progress Bar | Pro: Line Rainbow' ),
    ea_widget( 'test-pb-pro-rainbow', 'eael-progress-bar', [
        'progress_bar_layout'     => 'line_rainbow',
        'progress_bar_title'      => 'Progress Bar',
        'progress_bar_value'      => [ 'unit' => '%', 'size' => 65 ],
        'progress_bar_show_count' => 'yes',
    ] ),

    ea_heading( 'Progress Bar | Pro: Circle Fill' ),
    ea_widget( 'test-pb-pro-circle-fill', 'eael-progress-bar', [
        'progress_bar_layout'     => 'circle_fill',
        'progress_bar_title'      => 'Progress Bar',
        'progress_bar_value'      => [ 'unit' => '%', 'size' => 80 ],
        'progress_bar_show_count' => 'yes',
    ] ),

    ea_heading( 'Progress Bar | Pro: Half Circle Fill' ),
    ea_widget( 'test-pb-pro-half-fill', 'eael-progress-bar', [
        'progress_bar_layout'     => 'half_circle_fill',
        'progress_bar_title'      => 'Progress Bar',
        'progress_bar_value'      => [ 'unit' => '%', 'size' => 70 ],
        'progress_bar_show_count' => 'yes',
    ] ),

    ea_heading( 'Progress Bar | Pro: Box' ),
    ea_widget( 'test-pb-pro-box', 'eael-progress-bar', [
        'progress_bar_layout'     => 'box',
        'progress_bar_title'      => 'Progress Bar',
        'progress_bar_value'      => [ 'unit' => '%', 'size' => 55 ],
        'progress_bar_show_count' => 'yes',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Display Count
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Display Count ──', 'h2' ),

    ea_heading( 'Progress Bar | Display Count: Off' ),
    ea_widget( 'test-pb-no-count', 'eael-progress-bar', [
        'progress_bar_layout'     => 'line',
        'progress_bar_title'      => 'No Count Bar',
        'progress_bar_value'      => [ 'unit' => '%', 'size' => 40 ],
        'progress_bar_show_count' => '',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Inner Title (Line only)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Inner Title ──', 'h2' ),

    ea_heading( 'Progress Bar | Inner Title: On' ),
    ea_widget( 'test-pb-inner-title', 'eael-progress-bar', [
        'progress_bar_layout'            => 'line',
        'progress_bar_title'             => 'Outer Title',
        'progress_bar_value'             => [ 'unit' => '%', 'size' => 45 ],
        'progress_bar_title_inner_show'  => 'yes',
        'progress_bar_title_inner'       => 'Inner Label',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Stripe (Line only)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Stripe ──', 'h2' ),

    ea_heading( 'Progress Bar | Stripe: On' ),
    ea_widget( 'test-pb-stripe', 'eael-progress-bar', [
        'progress_bar_layout'          => 'line',
        'progress_bar_title'           => 'Stripe Bar',
        'progress_bar_value'           => [ 'unit' => '%', 'size' => 70 ],
        'progress_bar_line_fill_stripe' => 'yes',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Alignment ──', 'h2' ),

    ea_heading( 'Progress Bar | Line: Left Aligned' ),
    ea_widget( 'test-pb-align-left', 'eael-progress-bar', [
        'progress_bar_layout'         => 'line',
        'progress_bar_title'          => 'Left Bar',
        'progress_bar_value'          => [ 'unit' => '%', 'size' => 50 ],
        'progress_bar_line_alignment' => 'left',
    ] ),

    ea_heading( 'Progress Bar | Circle: Right Aligned' ),
    ea_widget( 'test-pb-align-right', 'eael-progress-bar', [
        'progress_bar_layout'           => 'circle',
        'progress_bar_title'            => 'Right Circle',
        'progress_bar_value'            => [ 'unit' => '%', 'size' => 50 ],
        'progress_bar_circle_alignment' => 'right',
    ] ),

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

WP_CLI::success( 'Progress Bar page ready → /progress-bar/' );
