<?php
/**
 * Test page: Tooltip
 * Run via: wp eval-file /scripts/setup-tooltip-page.php
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

// - Tooltip page --------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Tooltip page ---' );

$slug    = getenv( 'TOOLTIP_PAGE_SLUG' ) ?: 'tooltip';
$page_id = ea_upsert_page( $slug, 'Tooltip' );

$widgets = [

    // ========================================================================
    // Content Types
    // ========================================================================

    ea_heading( '- Content Types -', 'h2' ),

    ea_heading( 'Default Tooltip' ),
    ea_widget( 'test-t-default', 'eael-tooltip', [
        'eael_tooltip_icon_content_new' => [
            'value'   => 'eicon-info-circle',
            'library' => 'eicons',
        ],
        'eael_tooltip_hover_content' => 'Default tooltip content',
    ] ),

    ea_heading( 'Content Type: Text' ),
    ea_widget( 'test-t-type-text', 'eael-tooltip', [
        'eael_tooltip_type'          => 'text',
        'eael_tooltip_content'       => 'Hover Me!',
        'eael_tooltip_hover_content' => 'Text tooltip content',
    ] ),

    ea_heading( 'Content Type: Image' ),
    ea_widget( 'test-t-type-image', 'eael-tooltip', [
        'eael_tooltip_type'          => 'image',
        'eael_tooltip_img_content'   => [ 'url' => '', 'id' => 0 ],
        'eael_tooltip_hover_content' => 'Image tooltip content',
    ] ),

    ea_heading( 'Content Type: Shortcode' ),
    ea_widget( 'test-t-type-shortcode', 'eael-tooltip', [
        'eael_tooltip_type'              => 'shortcode',
        'eael_tooltip_shortcode_content' => '[ea_test_shortcode]',
        'eael_tooltip_hover_content'     => 'Shortcode tooltip content',
    ] ),

    // ========================================================================
    // Tooltip Direction
    // ========================================================================

    ea_heading( '- Tooltip Direction -', 'h2' ),

    ea_heading( 'Tooltip Direction: Left' ),
    ea_widget( 'test-t-dir-left', 'eael-tooltip', [
        'eael_tooltip_hover_dir'     => 'left',
        'eael_tooltip_hover_content' => 'Left tooltip',
    ] ),

    ea_heading( 'Tooltip Direction: Top' ),
    ea_widget( 'test-t-dir-top', 'eael-tooltip', [
        'eael_tooltip_hover_dir'     => 'top',
        'eael_tooltip_hover_content' => 'Top tooltip',
    ] ),

    ea_heading( 'Tooltip Direction: Bottom' ),
    ea_widget( 'test-t-dir-bottom', 'eael-tooltip', [
        'eael_tooltip_hover_dir'     => 'bottom',
        'eael_tooltip_hover_content' => 'Bottom tooltip',
    ] ),

    // ========================================================================
    // Link Variants
    // ========================================================================

    ea_heading( '- Link Variants -', 'h2' ),

    ea_heading( 'Tooltip | External Link (target=_blank)' ),
    ea_widget( 'test-t-link-external', 'eael-tooltip', [
        'eael_tooltip_enable_link' => 'yes',
        'eael_tooltip_link'        => [
            'url'               => '#',
            'is_external'       => 'on',
            'nofollow'          => '',
            'custom_attributes' => '',
        ],
        'eael_tooltip_hover_content' => 'External link tooltip',
    ] ),

    ea_heading( 'Tooltip | Nofollow Link' ),
    ea_widget( 'test-t-link-nofollow', 'eael-tooltip', [
        'eael_tooltip_enable_link' => 'yes',
        'eael_tooltip_link'        => [
            'url'               => '#',
            'is_external'       => '',
            'nofollow'          => 'on',
            'custom_attributes' => '',
        ],
        'eael_tooltip_hover_content' => 'Nofollow link tooltip',
    ] ),

    // ========================================================================
    // Alignment
    // ========================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'Tooltip | Alignment: Center' ),
    ea_widget( 'test-t-align-center', 'eael-tooltip', [
        'eael_tooltip_content_alignment' => 'center',
        'eael_tooltip_hover_content'     => 'Center aligned tooltip',
    ] ),

    ea_heading( 'Tooltip | Alignment: Right' ),
    ea_widget( 'test-t-align-right', 'eael-tooltip', [
        'eael_tooltip_content_alignment' => 'right',
        'eael_tooltip_hover_content'     => 'Right aligned tooltip',
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

WP_CLI::success( 'Tooltip page ready → /tooltip/' );
