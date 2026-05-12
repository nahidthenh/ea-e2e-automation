<?php
/**
 * Test page: Divider
 * Run via: wp eval-file /scripts/setup-divider-page.php
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

// - Divider page --------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Divider page ---' );

$slug    = getenv( 'DIVIDER_PAGE_SLUG' ) ?: 'divider';
$page_id = ea_upsert_page( $slug, 'Divider' );

$widgets = [

    // ========================================================================
    // Divider Types
    // ========================================================================

    ea_heading( '- Divider Types -', 'h2' ),

    ea_heading( 'Default Divider (Plain, Horizontal)' ),
    ea_widget( 'test-d-plain', 'eael-divider', [
        'divider_type'      => 'plain',
        'divider_direction' => 'horizontal',
        'divider_style'     => 'dashed',
        'align'             => 'center',
    ] ),

    ea_heading( 'Divider | Text Type' ),
    ea_widget( 'test-d-text', 'eael-divider', [
        'divider_type'         => 'text',
        'divider_direction'    => 'horizontal',
        'divider_style'        => 'dashed',
        'divider_text'         => 'Section Title',
        'text_html_tag'        => 'span',
        'divider_left_switch'  => 'yes',
        'divider_right_switch' => 'yes',
        'align'                => 'center',
    ] ),

    ea_heading( 'Divider | Icon Type' ),
    ea_widget( 'test-d-icon', 'eael-divider', [
        'divider_type'         => 'icon',
        'divider_direction'    => 'horizontal',
        'divider_style'        => 'dashed',
        'divider_icon_new'     => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        'divider_left_switch'  => 'yes',
        'divider_right_switch' => 'yes',
        'align'                => 'center',
    ] ),

    ea_heading( 'Divider | Vertical Direction' ),
    ea_widget( 'test-d-vertical', 'eael-divider', [
        'divider_type'      => 'plain',
        'divider_direction' => 'vertical',
        'divider_style'     => 'solid',
        'align'             => 'center',
    ] ),

    // ========================================================================
    // Left / Right Divider Toggles
    // ========================================================================

    ea_heading( '- Left/Right Divider Toggles -', 'h2' ),

    ea_heading( 'Divider | Left Divider Hidden' ),
    ea_widget( 'test-d-no-left', 'eael-divider', [
        'divider_type'         => 'text',
        'divider_direction'    => 'horizontal',
        'divider_style'        => 'dashed',
        'divider_text'         => 'No Left Line',
        'text_html_tag'        => 'span',
        'divider_left_switch'  => '',
        'divider_right_switch' => 'yes',
        'align'                => 'center',
    ] ),

    ea_heading( 'Divider | Right Divider Hidden' ),
    ea_widget( 'test-d-no-right', 'eael-divider', [
        'divider_type'         => 'text',
        'divider_direction'    => 'horizontal',
        'divider_style'        => 'dashed',
        'divider_text'         => 'No Right Line',
        'text_html_tag'        => 'span',
        'divider_left_switch'  => 'yes',
        'divider_right_switch' => '',
        'align'                => 'center',
    ] ),

    // ========================================================================
    // Alignment
    // ========================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'Divider | Align Left' ),
    ea_widget( 'test-d-align-left', 'eael-divider', [
        'divider_type'      => 'plain',
        'divider_direction' => 'horizontal',
        'divider_style'     => 'dashed',
        'align'             => 'left',
    ] ),

    ea_heading( 'Divider | Align Right' ),
    ea_widget( 'test-d-align-right', 'eael-divider', [
        'divider_type'      => 'plain',
        'divider_direction' => 'horizontal',
        'divider_style'     => 'dashed',
        'align'             => 'right',
    ] ),

    // ========================================================================
    // Border Styles
    // ========================================================================

    ea_heading( '- Border Styles -', 'h2' ),

    ea_heading( 'Divider | Style: Solid' ),
    ea_widget( 'test-d-solid', 'eael-divider', [
        'divider_type'      => 'plain',
        'divider_direction' => 'horizontal',
        'divider_style'     => 'solid',
        'align'             => 'center',
    ] ),

    ea_heading( 'Divider | Style: Dotted' ),
    ea_widget( 'test-d-dotted', 'eael-divider', [
        'divider_type'      => 'plain',
        'divider_direction' => 'horizontal',
        'divider_style'     => 'dotted',
        'align'             => 'center',
    ] ),

    ea_heading( 'Divider | Style: Double' ),
    ea_widget( 'test-d-double', 'eael-divider', [
        'divider_type'      => 'plain',
        'divider_direction' => 'horizontal',
        'divider_style'     => 'double',
        'align'             => 'center',
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

WP_CLI::success( 'Divider page ready → /divider/' );
