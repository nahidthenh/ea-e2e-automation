<?php
/**
 * Test page: SVG Draw
 * Run via: wp eval-file /scripts/setup-svg-draw-page.php
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

// - SVG Draw page -------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- SVG Draw page ---' );

$slug    = getenv( 'SVG_DRAW_PAGE_SLUG' ) ?: 'svg-draw';
$page_id = ea_upsert_page( $slug, 'SVG Draw' );

$custom_svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' stroke='black' fill='transparent'/><path d='M10 50 Q50 10 90 50'/></svg>";

$widgets = [

    // ====================================================================
    // Source Type
    // ====================================================================

    ea_heading( '- Source Type -', 'h2' ),

    ea_heading( 'Default SVG Draw' ),
    ea_widget( 'test-sd-default', 'eael-svg-draw', [] ),

    ea_heading( 'SVG Draw | Source: Custom SVG' ),
    ea_widget( 'test-sd-src-custom', 'eael-svg-draw',
        [
            'eael_svg_src' => 'custom',
            'svg_html'     => $custom_svg,
        ]
    ),

    // ====================================================================
    // Animation Triggers
    // ====================================================================

    ea_heading( '- Animation Triggers -', 'h2' ),

    ea_heading( 'SVG Draw | Animation: None' ),
    ea_widget( 'test-sd-anim-none', 'eael-svg-draw',
        [
            'eael_svg_animation_on' => 'none',
        ]
    ),

    ea_heading( 'SVG Draw | Animation: Page Scroll' ),
    ea_widget( 'test-sd-anim-scroll', 'eael-svg-draw',
        [
            'eael_svg_animation_on' => 'page-scroll',
        ]
    ),

    ea_heading( 'SVG Draw | Animation: Mouse Hover' ),
    ea_widget( 'test-sd-anim-hover', 'eael-svg-draw',
        [
            'eael_svg_animation_on' => 'mouse-hover',
        ]
    ),

    // ====================================================================
    // Fill Type
    // ====================================================================

    ea_heading( '- Fill Type -', 'h2' ),

    ea_heading( 'SVG Draw | Fill: Always' ),
    ea_widget( 'test-sd-fill-always', 'eael-svg-draw',
        [
            'eael_svg_fill' => 'always',
        ]
    ),

    ea_heading( 'SVG Draw | Fill: After Draw' ),
    ea_widget( 'test-sd-fill-after', 'eael-svg-draw',
        [
            'eael_svg_fill' => 'after',
        ]
    ),

    ea_heading( 'SVG Draw | Fill: Before Draw' ),
    ea_widget( 'test-sd-fill-before', 'eael-svg-draw',
        [
            'eael_svg_fill' => 'before',
        ]
    ),

    // ====================================================================
    // Alignment
    // ====================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'SVG Draw | Alignment: Left' ),
    ea_widget( 'test-sd-align-left', 'eael-svg-draw',
        [
            'eael_svg_alignment' => 'left',
        ]
    ),

    ea_heading( 'SVG Draw | Alignment: Right' ),
    ea_widget( 'test-sd-align-right', 'eael-svg-draw',
        [
            'eael_svg_alignment' => 'right',
        ]
    ),

    // ====================================================================
    // Link Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'SVG Draw | Link: URL (#)' ),
    ea_widget( 'test-sd-link', 'eael-svg-draw',
        [
            'eael_svg_link' => [
                'url'               => '#',
                'is_external'       => '',
                'nofollow'          => '',
                'custom_attributes' => '',
            ],
        ]
    ),

    ea_heading( 'SVG Draw | Link: External (target=_blank)' ),
    ea_widget( 'test-sd-link-external', 'eael-svg-draw',
        [
            'eael_svg_link' => [
                'url'               => 'https://essential-addons.com',
                'is_external'       => 'on',
                'nofollow'          => '',
                'custom_attributes' => '',
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

WP_CLI::success( 'SVG Draw page ready → /svg-draw/' );
