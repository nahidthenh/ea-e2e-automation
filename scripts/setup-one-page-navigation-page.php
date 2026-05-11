<?php
/**
 * Test page: One Page Navigation
 * Run via: wp eval-file /scripts/setup-one-page-navigation-page.php
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

// shared repeater items (3 dots pointing at hypothetical sections)
$default_dots = [
    [
        'section_title' => 'Section One',
        'section_id'    => 'section-one',
        'dot_icon_new'  => [ 'value' => 'fas fa-circle', 'library' => 'fa-solid' ],
    ],
    [
        'section_title' => 'Section Two',
        'section_id'    => 'section-two',
        'dot_icon_new'  => [ 'value' => 'fas fa-circle', 'library' => 'fa-solid' ],
    ],
    [
        'section_title' => 'Section Three',
        'section_id'    => 'section-three',
        'dot_icon_new'  => [ 'value' => 'fas fa-circle', 'library' => 'fa-solid' ],
    ],
];

// ── One Page Navigation page ───────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- One Page Navigation page ---' );

$slug    = getenv( 'ONE_PAGE_NAVIGATION_PAGE_SLUG' ) ?: 'one-page-navigation';
$page_id = ea_upsert_page( $slug, 'One Page Navigation' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Baseline / Default
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Default / Baseline ──', 'h2' ),

    ea_heading( 'Default One Page Navigation' ),
    ea_widget( 'test-opn-default', 'eael-one-page-nav',
        [
            'nav_dots'      => $default_dots,
            'nav_tooltip'   => 'yes',
            'tooltip_arrow' => 'yes',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Alignment Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Alignment Variants ──', 'h2' ),

    ea_heading( 'One Page Navigation | Alignment: Right (explicit)' ),
    ea_widget( 'test-opn-align-right', 'eael-one-page-nav',
        [
            'nav_dots'         => $default_dots,
            'heading_alignment' => 'right',
        ]
    ),

    ea_heading( 'One Page Navigation | Alignment: Left' ),
    ea_widget( 'test-opn-align-left', 'eael-one-page-nav',
        [
            'nav_dots'         => $default_dots,
            'heading_alignment' => 'left',
        ]
    ),

    ea_heading( 'One Page Navigation | Alignment: Top' ),
    ea_widget( 'test-opn-align-top', 'eael-one-page-nav',
        [
            'nav_dots'         => $default_dots,
            'heading_alignment' => 'top',
        ]
    ),

    ea_heading( 'One Page Navigation | Alignment: Bottom' ),
    ea_widget( 'test-opn-align-bottom', 'eael-one-page-nav',
        [
            'nav_dots'         => $default_dots,
            'heading_alignment' => 'bottom',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Tooltip Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Tooltip Variants ──', 'h2' ),

    ea_heading( 'One Page Navigation | Tooltip: Off' ),
    ea_widget( 'test-opn-tooltip-off', 'eael-one-page-nav',
        [
            'nav_dots'    => $default_dots,
            'nav_tooltip' => '',
        ]
    ),

    ea_heading( 'One Page Navigation | Tooltip: On, Arrow: Off' ),
    ea_widget( 'test-opn-tooltip-arrow-off', 'eael-one-page-nav',
        [
            'nav_dots'      => $default_dots,
            'nav_tooltip'   => 'yes',
            'tooltip_arrow' => '',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Scroll Behaviour
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Scroll Behaviour ──', 'h2' ),

    ea_heading( 'One Page Navigation | Scroll Wheel: On' ),
    ea_widget( 'test-opn-scroll-wheel-on', 'eael-one-page-nav',
        [
            'nav_dots'    => $default_dots,
            'scroll_wheel' => 'on',
        ]
    ),

    ea_heading( 'One Page Navigation | Scroll Keys: On' ),
    ea_widget( 'test-opn-scroll-keys-on', 'eael-one-page-nav',
        [
            'nav_dots'    => $default_dots,
            'scroll_keys' => 'on',
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

WP_CLI::success( 'One Page Navigation page ready → /' . $slug . '/' );
