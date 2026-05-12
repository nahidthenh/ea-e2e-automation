<?php
/**
 * Test page: Toggle
 * Run via: wp eval-file /scripts/setup-toggle-page.php
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

// - Toggle page --------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Toggle page ---' );

$slug    = getenv( 'TOGGLE_PAGE_SLUG' ) ?: 'toggle';
$page_id = ea_upsert_page( $slug, 'Toggle' );

$widgets = [

    // ========================================================================
    // Effects Styles
    // ========================================================================

    ea_heading( '- Effects Styles -', 'h2' ),

    ea_heading( 'Default Toggle (Default Style, Round Switch)' ),
    ea_widget( 'test-t-default', 'eael-toggle', [
        // All defaults: effects_style=default, switch_style=round, content=content
        'primary_label'    => 'Light',
        'secondary_label'  => 'Dark',
        'primary_content'  => 'Primary Content',
        'secondary_content'=> 'Secondary Content',
    ] ),

    ea_heading( 'Toggle | Liquid Glass (Glossy) Style' ),
    ea_widget( 'test-t-glossy', 'eael-toggle', [
        'eael_toggle_effects_style' => 'glossy',
        'primary_label'             => 'Light',
        'secondary_label'           => 'Dark',
        'primary_content'           => 'Primary Content',
        'secondary_content'         => 'Secondary Content',
    ] ),

    ea_heading( 'Toggle | Crystalmorphism (Grasshopper) Style' ),
    ea_widget( 'test-t-grasshopper', 'eael-toggle', [
        'eael_toggle_effects_style' => 'grasshopper',
        'primary_label'             => 'Light',
        'secondary_label'           => 'Dark',
        'primary_content'           => 'Primary Content',
        'secondary_content'         => 'Secondary Content',
    ] ),

    // ========================================================================
    // Switch Styles
    // ========================================================================

    ea_heading( '- Switch Styles -', 'h2' ),

    ea_heading( 'Toggle | Switch Style: Rectangle' ),
    ea_widget( 'test-t-rectangle', 'eael-toggle', [
        'switch_style'     => 'rectangle',
        'primary_label'    => 'Light',
        'secondary_label'  => 'Dark',
        'primary_content'  => 'Primary Content',
        'secondary_content'=> 'Secondary Content',
    ] ),

    // ========================================================================
    // Alignment
    // ========================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'Toggle | Switch Alignment: Left' ),
    ea_widget( 'test-t-align-left', 'eael-toggle', [
        'toggle_switch_alignment' => 'left',
        'primary_label'           => 'Light',
        'secondary_label'         => 'Dark',
        'primary_content'         => 'Primary Content',
        'secondary_content'       => 'Secondary Content',
    ] ),

    ea_heading( 'Toggle | Switch Alignment: Right' ),
    ea_widget( 'test-t-align-right', 'eael-toggle', [
        'toggle_switch_alignment' => 'right',
        'primary_label'           => 'Light',
        'secondary_label'         => 'Dark',
        'primary_content'         => 'Primary Content',
        'secondary_content'       => 'Secondary Content',
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

WP_CLI::success( 'Toggle page ready → /toggle/' );
