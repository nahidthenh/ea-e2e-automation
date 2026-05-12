<?php
/**
 * Test page: Counter
 * Run via: wp eval-file /scripts/setup-counter-page.php
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

// - Counter page -----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Counter page ---' );

$slug    = getenv( 'COUNTER_PAGE_SLUG' ) ?: 'counter';
$page_id = ea_upsert_page( $slug, 'Counter' );

$icon_default = [ 'value' => 'eicon-star', 'library' => 'eicons' ];
$icon_image   = [ 'url' => \Elementor\Utils::get_placeholder_image_src(), 'id' => 0 ];

$widgets = [

    // ====================================================================
    // Layouts
    // Render code paths: layouts 1/5/6 share one branch; 2, 3, 4 are distinct.
    // ====================================================================

    ea_heading( '- Layouts -', 'h2' ),

    ea_heading( 'Default Counter (Layout 1)' ),
    ea_widget( 'test-c-default', 'eael-counter', [
        'counter_layout' => 'layout-1',
        'ending_number'  => 250,
        'counter_title'  => 'Counter Title',
    ] ),

    ea_heading( 'Counter | Layout 2' ),
    ea_widget( 'test-c-layout-2', 'eael-counter', [
        'counter_layout' => 'layout-2',
        'ending_number'  => 100,
        'counter_title'  => 'Counter Title',
    ] ),

    ea_heading( 'Counter | Layout 3' ),
    ea_widget( 'test-c-layout-3', 'eael-counter', [
        'counter_layout' => 'layout-3',
        'ending_number'  => 500,
        'counter_title'  => 'Counter Title',
    ] ),

    ea_heading( 'Counter | Layout 4' ),
    ea_widget( 'test-c-layout-4', 'eael-counter', [
        'counter_layout' => 'layout-4',
        'ending_number'  => 750,
        'counter_title'  => 'Counter Title',
    ] ),

    ea_heading( 'Counter | Layout 5' ),
    ea_widget( 'test-c-layout-5', 'eael-counter', [
        'counter_layout' => 'layout-5',
        'ending_number'  => 200,
        'counter_title'  => 'Counter Title',
    ] ),

    ea_heading( 'Counter | Layout 6' ),
    ea_widget( 'test-c-layout-6', 'eael-counter', [
        'counter_layout' => 'layout-6',
        'ending_number'  => 300,
        'counter_title'  => 'Counter Title',
    ] ),

    // ====================================================================
    // Icon Types
    // ====================================================================

    ea_heading( '- Icon Types -', 'h2' ),

    ea_heading( 'Counter | Icon Type: Icon' ),
    ea_widget( 'test-c-icon', 'eael-counter', [
        'eael_icon_type'   => 'icon',
        'counter_icon_new' => $icon_default,
        'ending_number'    => 42,
        'counter_title'    => 'Icon Counter',
    ] ),

    ea_heading( 'Counter | Icon Type: Image' ),
    ea_widget( 'test-c-img', 'eael-counter', [
        'eael_icon_type' => 'image',
        'icon_image'     => $icon_image,
        'ending_number'  => 99,
        'counter_title'  => 'Image Counter',
    ] ),

    // ====================================================================
    // Number Options
    // ====================================================================

    ea_heading( '- Number Options -', 'h2' ),

    ea_heading( 'Counter | Prefix: $' ),
    ea_widget( 'test-c-prefix', 'eael-counter', [
        'number_prefix' => '$',
        'ending_number' => 100,
        'counter_title' => 'Prefix Counter',
    ] ),

    ea_heading( 'Counter | Suffix: %' ),
    ea_widget( 'test-c-suffix', 'eael-counter', [
        'number_suffix' => '%',
        'ending_number' => 95,
        'counter_title' => 'Suffix Counter',
    ] ),

    ea_heading( 'Counter | Comma Separator: Off' ),
    ea_widget( 'test-c-no-comma', 'eael-counter', [
        'show_comma_separator' => '',
        'ending_number'        => 1234,
        'counter_title'        => 'No Comma Counter',
    ] ),

    ea_heading( 'Counter | Number Divider: On' ),
    ea_widget( 'test-c-divider', 'eael-counter', [
        'num_divider'   => 'yes',
        'ending_number' => 300,
        'counter_title' => 'Divider Counter',
    ] ),

    // ====================================================================
    // Alignment
    // ====================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'Counter | Align Left' ),
    ea_widget( 'test-c-align-left', 'eael-counter', [
        'counter_align' => 'left',
        'ending_number' => 250,
        'counter_title' => 'Left Counter',
    ] ),

    ea_heading( 'Counter | Align Right' ),
    ea_widget( 'test-c-align-right', 'eael-counter', [
        'counter_align' => 'right',
        'ending_number' => 250,
        'counter_title' => 'Right Counter',
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

WP_CLI::success( 'Counter page ready → /counter/' );
