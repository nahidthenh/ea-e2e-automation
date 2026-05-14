<?php
/**
 * Test page: Countdown
 * Run via: wp eval-file /scripts/setup-countdown-page.php
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

// - Countdown page -----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Countdown page ---' );

$slug    = getenv( 'COUNTDOWN_PAGE_SLUG' ) ?: 'countdown';
$page_id = ea_upsert_page( $slug, 'Countdown' );

// Future date well beyond any test run — ensures the timer is always active.
$due_date = '2030-01-01 00:00:00';

$widgets = [

    // ====================================================================
    // Timer Type Variants
    // ====================================================================

    ea_heading( '- Timer Type Variants -', 'h2' ),

    ea_heading( 'Default Countdown' ),
    ea_widget( 'test-c-default', 'eael-countdown',
        [
            'eael_countdown_due_time' => $due_date,
        ]
    ),

    ea_heading( 'Countdown | Evergreen Timer' ),
    ea_widget( 'test-c-evergreen', 'eael-countdown',
        [
            'eael_countdown_type'              => 'evergreen',
            'eael_evergreen_counter_hours'     => 5,
            'eael_evergreen_counter_minutes'   => 30,
        ]
    ),

    // ====================================================================
    // Label Position Variants
    // ====================================================================

    ea_heading( '- Label Position Variants -', 'h2' ),

    ea_heading( 'Countdown | Label: Inline' ),
    ea_widget( 'test-c-label-inline', 'eael-countdown',
        [
            'eael_countdown_due_time'   => $due_date,
            'eael_countdown_label_view' => 'eael-countdown-label-inline',
        ]
    ),

    // ====================================================================
    // Layout Variants
    // ====================================================================

    ea_heading( '- Layout Variants -', 'h2' ),

    ea_heading( 'Countdown | Layout: List' ),
    ea_widget( 'test-c-layout-list', 'eael-countdown',
        [
            'eael_countdown_due_time'         => $due_date,
            'eael_section_countdown_layout'   => 'grid',
        ]
    ),

    // ====================================================================
    // Unit Visibility
    // ====================================================================

    ea_heading( '- Unit Visibility -', 'h2' ),

    ea_heading( 'Countdown | No Hours' ),
    ea_widget( 'test-c-no-hours', 'eael-countdown',
        [
            'eael_countdown_due_time'  => $due_date,
            'eael_countdown_hours'     => '',
        ]
    ),

    ea_heading( 'Countdown | No Seconds' ),
    ea_widget( 'test-c-no-seconds', 'eael-countdown',
        [
            'eael_countdown_due_time'  => $due_date,
            'eael_countdown_seconds'   => '',
        ]
    ),

    // ====================================================================
    // Separator Variants
    // ====================================================================

    ea_heading( '- Separator Variants -', 'h2' ),

    ea_heading( 'Countdown | Separator: Solid' ),
    ea_widget( 'test-c-separator-solid', 'eael-countdown',
        [
            'eael_countdown_due_time'        => $due_date,
            'eael_countdown_separator'       => 'eael-countdown-show-separator',
            'eael_countdown_separator_style' => 'solid',
        ]
    ),

    ea_heading( 'Countdown | Separator: Dotted' ),
    ea_widget( 'test-c-separator-dotted', 'eael-countdown',
        [
            'eael_countdown_due_time'        => $due_date,
            'eael_countdown_separator'       => 'eael-countdown-show-separator',
            'eael_countdown_separator_style' => 'dotted',
        ]
    ),

    // ====================================================================
    // Expire Action
    // ====================================================================

    ea_heading( '- Expire Action -', 'h2' ),

    ea_heading( 'Countdown | Expire: Text Message' ),
    ea_widget( 'test-c-expire-text', 'eael-countdown',
        [
            'eael_countdown_due_time'       => $due_date,
            'countdown_expire_type'         => 'text',
            'countdown_expiry_text_title'   => 'Sale Ended!',
            'countdown_expiry_text'         => 'The promotion has expired. Check back later.',
        ]
    ),

    // ====================================================================
    // Alignment Variants
    // ====================================================================

    ea_heading( '- Alignment Variants -', 'h2' ),

    ea_heading( 'Countdown | Align: Left' ),
    ea_widget( 'test-c-align-left', 'eael-countdown',
        [
            'eael_countdown_due_time'      => $due_date,
            'eael_countdown_alignment'     => 'left',
        ]
    ),

    ea_heading( 'Countdown | Align: Right' ),
    ea_widget( 'test-c-align-right', 'eael-countdown',
        [
            'eael_countdown_due_time'      => $due_date,
            'eael_countdown_alignment'     => 'right',
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

WP_CLI::success( 'Countdown page ready → /' . $slug . '/' );
