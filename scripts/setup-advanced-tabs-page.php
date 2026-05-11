<?php
/**
 * Test page: Advanced Tabs
 * Run via: wp eval-file /scripts/setup-advanced-tabs-page.php
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

// ── Advanced Tabs page ─────────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Advanced Tabs page ---' );

$slug    = getenv( 'ADVANCED_TABS_PAGE_SLUG' ) ?: 'advanced-tabs';
$page_id = ea_upsert_page( $slug, 'Advanced Tabs' );

// eicons are always registered — avoids FA dependency in test environment
$icon_star = [ 'value' => 'eicon-star',         'library' => 'eicons' ];
$icon_cog  = [ 'value' => 'eicon-cog',          'library' => 'eicons' ];
$icon_info = [ 'value' => 'eicon-info-circle',  'library' => 'eicons' ];

// 3 tabs with distinct, verifiable titles and content
$tabs = [
    [
        'eael_adv_tabs_tab_title'           => 'Alpha',
        'eael_adv_tabs_tab_show_as_default' => 'active-default',
        'eael_adv_tabs_icon_type'           => 'icon',
        'eael_adv_tabs_tab_title_icon_new'  => $icon_star,
        'eael_adv_tabs_text_type'           => 'content',
        'eael_adv_tabs_tab_content'         => 'Alpha tab content.',
    ],
    [
        'eael_adv_tabs_tab_title'          => 'Beta',
        'eael_adv_tabs_icon_type'          => 'icon',
        'eael_adv_tabs_tab_title_icon_new' => $icon_cog,
        'eael_adv_tabs_text_type'          => 'content',
        'eael_adv_tabs_tab_content'        => 'Beta tab content.',
    ],
    [
        'eael_adv_tabs_tab_title'          => 'Gamma',
        'eael_adv_tabs_icon_type'          => 'icon',
        'eael_adv_tabs_tab_title_icon_new' => $icon_info,
        'eael_adv_tabs_text_type'          => 'content',
        'eael_adv_tabs_tab_content'        => 'Gamma tab content.',
    ],
];

// Tabs without icons (for icon-off widget)
$tabs_no_icon = array_map( function ( $tab ) {
    $tab['eael_adv_tabs_icon_type'] = 'none';
    return $tab;
}, $tabs );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════════
    // Layouts
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Layouts ──', 'h2' ),

    ea_heading( 'Default Advanced Tabs' ),
    ea_widget( 'test-at-default', 'eael-adv-tabs', [
        'eael_adv_tab_layout'   => 'eael-tabs-horizontal',
        'eael_adv_tabs_icon_show' => 'yes',
        'eael_adv_tab_icon_position'          => 'eael-tab-inline-icon',
        'eael_adv_tabs_tab_icon_alignment'    => 'before',
        'eael_adv_tabs_default_active_tab'    => 'yes',
        'eael_adv_tabs_tab'     => $tabs,
    ] ),

    ea_heading( 'Advanced Tabs | Layout: Vertical' ),
    ea_widget( 'test-at-vertical', 'eael-adv-tabs', [
        'eael_adv_tab_layout'              => 'eael-tabs-vertical',
        'eael_adv_tabs_default_active_tab' => 'yes',
        'eael_adv_tabs_tab'                => $tabs,
    ] ),

    // ══════════════════════════════════════════════════════════════════════════
    // Icon Variants
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Icon Variants ──', 'h2' ),

    ea_heading( 'Advanced Tabs | Icon: Stacked' ),
    ea_widget( 'test-at-icon-stacked', 'eael-adv-tabs', [
        'eael_adv_tabs_icon_show'          => 'yes',
        'eael_adv_tab_icon_position'       => 'eael-tab-top-icon',
        'eael_adv_tabs_default_active_tab' => 'yes',
        'eael_adv_tabs_tab'                => $tabs,
    ] ),

    ea_heading( 'Advanced Tabs | Icon: Off' ),
    ea_widget( 'test-at-icon-off', 'eael-adv-tabs', [
        'eael_adv_tabs_icon_show'          => '',
        'eael_adv_tabs_default_active_tab' => 'yes',
        'eael_adv_tabs_tab'                => $tabs_no_icon,
    ] ),

    ea_heading( 'Advanced Tabs | Icon Alignment: After' ),
    ea_widget( 'test-at-icon-after', 'eael-adv-tabs', [
        'eael_adv_tabs_icon_show'          => 'yes',
        'eael_adv_tab_icon_position'       => 'eael-tab-inline-icon',
        'eael_adv_tabs_tab_icon_alignment' => 'after',
        'eael_adv_tabs_default_active_tab' => 'yes',
        'eael_adv_tabs_tab'                => $tabs,
    ] ),

    // ══════════════════════════════════════════════════════════════════════════
    // Behaviour
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Behaviour ──', 'h2' ),

    ea_heading( 'Advanced Tabs | Toggle Tab' ),
    ea_widget( 'test-at-toggle', 'eael-adv-tabs', [
        'eael_adv_tabs_toggle_tab'         => 'yes',
        'eael_adv_tabs_default_active_tab' => 'yes',
        'eael_adv_tabs_tab'                => $tabs,
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

WP_CLI::success( 'Advanced Tabs page ready → /advanced-tabs/' );
