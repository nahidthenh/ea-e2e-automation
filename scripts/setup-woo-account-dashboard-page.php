<?php
/**
 * Test page: Woo Account Dashboard
 * Run via: wp eval-file /scripts/setup-woo-account-dashboard-page.php
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

// ── Woo Account Dashboard page ─────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Account Dashboard page ---' );

$slug    = getenv( 'WOO_ACCOUNT_DASHBOARD_PAGE_SLUG' ) ?: 'woo-account-dashboard';
$page_id = ea_upsert_page( $slug, 'Woo Account Dashboard' );

// Shared default tabs repeater (all 6 standard WC tabs).
$default_tabs = [
    [ 'field_type' => 'default', 'field_key' => 'dashboard',       'eael_account_dashboard_tab_name' => 'Dashboard' ],
    [ 'field_type' => 'default', 'field_key' => 'orders',          'eael_account_dashboard_tab_name' => 'Orders' ],
    [ 'field_type' => 'default', 'field_key' => 'downloads',       'eael_account_dashboard_tab_name' => 'Downloads' ],
    [ 'field_type' => 'default', 'field_key' => 'edit-address',    'eael_account_dashboard_tab_name' => 'Addresses' ],
    [ 'field_type' => 'default', 'field_key' => 'edit-account',    'eael_account_dashboard_tab_name' => 'Account Details' ],
    [ 'field_type' => 'default', 'field_key' => 'customer-logout', 'eael_account_dashboard_tab_name' => 'Logout' ],
];

// Reduced tab set used by the fewer-tabs variant.
$few_tabs = [
    [ 'field_type' => 'default', 'field_key' => 'dashboard', 'eael_account_dashboard_tab_name' => 'Dashboard' ],
    [ 'field_type' => 'default', 'field_key' => 'orders',    'eael_account_dashboard_tab_name' => 'Orders' ],
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Preset Layouts
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Preset Layouts ──', 'h2' ),

    ea_heading( 'Woo Account Dashboard | Preset 1 (default)' ),
    ea_widget( 'test-wad-preset-1', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout'  => 'preset-1',
        'eael_account_dashboard_tabs'   => $default_tabs,
    ] ),

    ea_heading( 'Woo Account Dashboard | Preset 2' ),
    ea_widget( 'test-wad-preset-2', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout'  => 'preset-2',
        'eael_account_dashboard_tabs'   => $default_tabs,
        'eael_account_dashboard_tabs_account_profile_avatar_show'   => 'yes',
        'eael_account_dashboard_tabs_account_profile_greeting_show' => 'yes',
        'eael_account_dashboard_tabs_account_profile_name_show'     => 'yes',
    ] ),

    ea_heading( 'Woo Account Dashboard | Preset 3' ),
    ea_widget( 'test-wad-preset-3', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout'  => 'preset-3',
        'eael_account_dashboard_tabs'   => $default_tabs,
        'eael_account_dashboard_tabs_account_profile_avatar_show'   => 'yes',
        'eael_account_dashboard_tabs_account_profile_greeting_show' => 'yes',
        'eael_account_dashboard_tabs_account_profile_name_show'     => 'yes',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Profile Section Toggles (Preset 1 — separate controls, default off)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Profile Section (Preset 1) ──', 'h2' ),

    ea_heading( 'Woo Account Dashboard | Preset 1 + Profile On (avatar + greeting + name)' ),
    ea_widget( 'test-wad-profile-on', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout'  => 'preset-1',
        'eael_account_dashboard_tabs'   => $default_tabs,
        'eael_account_dashboard_tabs_account_profile_avatar_show_preset_1'   => 'yes',
        'eael_account_dashboard_tabs_account_profile_greeting_show_preset_1' => 'yes',
        'eael_account_dashboard_tabs_account_profile_name_show_preset_1'     => 'yes',
        'eael_account_dashboard_tabs_account_profile_greeting_text'          => 'Welcome',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Profile Section Toggles (Preset 2 — shared controls, default on)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Profile Section (Preset 2) ──', 'h2' ),

    ea_heading( 'Woo Account Dashboard | Preset 2 — No Avatar' ),
    ea_widget( 'test-wad-no-avatar', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout'  => 'preset-2',
        'eael_account_dashboard_tabs'   => $default_tabs,
        'eael_account_dashboard_tabs_account_profile_avatar_show'   => '',
        'eael_account_dashboard_tabs_account_profile_greeting_show' => 'yes',
        'eael_account_dashboard_tabs_account_profile_name_show'     => 'yes',
    ] ),

    ea_heading( 'Woo Account Dashboard | Preset 2 — No Greeting' ),
    ea_widget( 'test-wad-no-greeting', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout'  => 'preset-2',
        'eael_account_dashboard_tabs'   => $default_tabs,
        'eael_account_dashboard_tabs_account_profile_avatar_show'   => 'yes',
        'eael_account_dashboard_tabs_account_profile_greeting_show' => '',
        'eael_account_dashboard_tabs_account_profile_name_show'     => 'yes',
    ] ),

    ea_heading( 'Woo Account Dashboard | Preset 2 — No Name' ),
    ea_widget( 'test-wad-no-name', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout'  => 'preset-2',
        'eael_account_dashboard_tabs'   => $default_tabs,
        'eael_account_dashboard_tabs_account_profile_avatar_show'   => 'yes',
        'eael_account_dashboard_tabs_account_profile_greeting_show' => 'yes',
        'eael_account_dashboard_tabs_account_profile_name_show'     => '',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Tab Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Tab Variants ──', 'h2' ),

    ea_heading( 'Woo Account Dashboard | Fewer Tabs (dashboard + orders only)' ),
    ea_widget( 'test-wad-few-tabs', 'eael-woo-account-dashboard', [
        'eael_dynamic_template_layout' => 'preset-1',
        'eael_account_dashboard_tabs'  => $few_tabs,
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

WP_CLI::success( 'Woo Account Dashboard page ready → /' . $slug . '/' );
