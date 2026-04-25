<?php
/**
 * Test page: Advanced Menu
 * Run via: wp eval-file /scripts/setup-advanced-menu-page.php
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

// ── Create / reuse test nav menu ───────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Advanced Menu page ---' );

$menu_name     = 'EA E2E Test Menu';
$existing_menu = wp_get_nav_menu_object( $menu_name );

if ( $existing_menu ) {
    $test_menu_id = (int) $existing_menu->term_id;
    WP_CLI::log( "  menu   : '{$menu_name}' already exists (ID {$test_menu_id})" );
} else {
    $test_menu_id = (int) wp_create_nav_menu( $menu_name );
    wp_update_nav_menu_item( $test_menu_id, 0, [
        'menu-item-title'  => 'Alpha',
        'menu-item-url'    => '#alpha',
        'menu-item-status' => 'publish',
    ] );
    wp_update_nav_menu_item( $test_menu_id, 0, [
        'menu-item-title'  => 'Beta',
        'menu-item-url'    => '#beta',
        'menu-item-status' => 'publish',
    ] );
    wp_update_nav_menu_item( $test_menu_id, 0, [
        'menu-item-title'  => 'Gamma',
        'menu-item-url'    => '#gamma',
        'menu-item-status' => 'publish',
    ] );
    WP_CLI::log( "  menu   : '{$menu_name}' created (ID {$test_menu_id}) with 3 items" );
}

// Shared icon overrides — eicons are always registered; avoids FA dependency.
$hamburger_icon = [ 'value' => 'eicon-menu-bar', 'library' => 'eicons' ];
$indicator_icon = [ 'value' => 'eicon-angle-down', 'library' => 'eicons' ];

// ── Advanced Menu page ─────────────────────────────────────────────────────

$slug    = getenv( 'ADVANCED_MENU_PAGE_SLUG' ) ?: 'advanced-menu';
$page_id = ea_upsert_page( $slug, 'Advanced Menu' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Skins
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Skins ──', 'h2' ),

    ea_heading( 'Default Advanced Menu (Skin: Default, Horizontal)' ),
    ea_widget( 'test-am-default', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                            => $test_menu_id,
            '_skin'                                              => 'default',
            'eael_advanced_menu_hamburger_icon'                  => $hamburger_icon,
            'default_eael_advanced_menu_item_indicator'          => $indicator_icon,
            'default_eael_advanced_menu_dropdown_item_indicator' => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Skin: One' ),
    ea_widget( 'test-am-skin-one', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                                => $test_menu_id,
            '_skin'                                                  => 'skin-one',
            'eael_advanced_menu_hamburger_icon'                      => $hamburger_icon,
            'skin_one_eael_advanced_menu_item_indicator'             => $indicator_icon,
            'skin_one_eael_advanced_menu_dropdown_item_indicator'    => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Skin: Two' ),
    ea_widget( 'test-am-skin-two', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                                => $test_menu_id,
            '_skin'                                                  => 'skin-two',
            'eael_advanced_menu_hamburger_icon'                      => $hamburger_icon,
            'skin_two_eael_advanced_menu_item_indicator'             => $indicator_icon,
            'skin_two_eael_advanced_menu_dropdown_item_indicator'    => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Skin: Three' ),
    ea_widget( 'test-am-skin-three', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                                => $test_menu_id,
            '_skin'                                                  => 'skin-three',
            'eael_advanced_menu_hamburger_icon'                      => $hamburger_icon,
            'skin_three_eael_advanced_menu_item_indicator'           => $indicator_icon,
            'skin_three_eael_advanced_menu_dropdown_item_indicator'  => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Skin: Four' ),
    ea_widget( 'test-am-skin-four', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                                => $test_menu_id,
            '_skin'                                                  => 'skin-four',
            'eael_advanced_menu_hamburger_icon'                      => $hamburger_icon,
            'skin_four_eael_advanced_menu_item_indicator'            => $indicator_icon,
            'skin_four_eael_advanced_menu_dropdown_item_indicator'   => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Skin: Five' ),
    ea_widget( 'test-am-skin-five', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                                => $test_menu_id,
            '_skin'                                                  => 'skin-five',
            'eael_advanced_menu_hamburger_icon'                      => $hamburger_icon,
            'skin_five_eael_advanced_menu_item_indicator'            => $indicator_icon,
            'skin_five_eael_advanced_menu_dropdown_item_indicator'   => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Skin: Six' ),
    ea_widget( 'test-am-skin-six', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                                => $test_menu_id,
            '_skin'                                                  => 'skin-six',
            'eael_advanced_menu_hamburger_icon'                      => $hamburger_icon,
            'skin_six_eael_advanced_menu_item_indicator'             => $indicator_icon,
            'skin_six_eael_advanced_menu_dropdown_item_indicator'    => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Skin: Seven' ),
    ea_widget( 'test-am-skin-seven', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                                => $test_menu_id,
            '_skin'                                                  => 'skin-seven',
            'eael_advanced_menu_hamburger_icon'                      => $hamburger_icon,
            'skin_seven_eael_advanced_menu_item_indicator'           => $indicator_icon,
            'skin_seven_eael_advanced_menu_dropdown_item_indicator'  => $indicator_icon,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Layout
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layout ──', 'h2' ),

    ea_heading( 'Advanced Menu | Layout: Vertical' ),
    ea_widget( 'test-am-vertical', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                            => $test_menu_id,
            '_skin'                                              => 'default',
            'default_eael_advanced_menu_layout'                  => 'vertical',
            'eael_advanced_menu_hamburger_icon'                  => $hamburger_icon,
            'default_eael_advanced_menu_item_indicator'          => $indicator_icon,
            'default_eael_advanced_menu_dropdown_item_indicator' => $indicator_icon,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Item Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Item Alignment ──', 'h2' ),

    ea_heading( 'Advanced Menu | Align: Center' ),
    ea_widget( 'test-am-align-center', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                            => $test_menu_id,
            '_skin'                                              => 'default',
            'default_eael_advanced_menu_item_alignment'          => 'eael-advanced-menu-align-center',
            'eael_advanced_menu_hamburger_icon'                  => $hamburger_icon,
            'default_eael_advanced_menu_item_indicator'          => $indicator_icon,
            'default_eael_advanced_menu_dropdown_item_indicator' => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Align: Right' ),
    ea_widget( 'test-am-align-right', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                            => $test_menu_id,
            '_skin'                                              => 'default',
            'default_eael_advanced_menu_item_alignment'          => 'eael-advanced-menu-align-right',
            'eael_advanced_menu_hamburger_icon'                  => $hamburger_icon,
            'default_eael_advanced_menu_item_indicator'          => $indicator_icon,
            'default_eael_advanced_menu_dropdown_item_indicator' => $indicator_icon,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Hamburger Options
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Hamburger Options ──', 'h2' ),

    ea_heading( 'Advanced Menu | Hamburger Align: Left' ),
    ea_widget( 'test-am-hamburger-left', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                            => $test_menu_id,
            '_skin'                                              => 'default',
            'eael_advanced_menu_hamburger_alignment'             => 'left',
            'eael_advanced_menu_hamburger_icon'                  => $hamburger_icon,
            'default_eael_advanced_menu_item_indicator'          => $indicator_icon,
            'default_eael_advanced_menu_dropdown_item_indicator' => $indicator_icon,
        ]
    ),

    ea_heading( 'Advanced Menu | Hamburger Align: Center' ),
    ea_widget( 'test-am-hamburger-center', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                            => $test_menu_id,
            '_skin'                                              => 'default',
            'eael_advanced_menu_hamburger_alignment'             => 'center',
            'eael_advanced_menu_hamburger_icon'                  => $hamburger_icon,
            'default_eael_advanced_menu_item_indicator'          => $indicator_icon,
            'default_eael_advanced_menu_dropdown_item_indicator' => $indicator_icon,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Options
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Options ──', 'h2' ),

    ea_heading( 'Advanced Menu | Full Width' ),
    ea_widget( 'test-am-full-width', 'eael-advanced-menu',
        [
            'eael_advanced_menu_menu'                            => $test_menu_id,
            '_skin'                                              => 'default',
            'eael_advanced_menu_full_width'                      => 'stretch',
            'eael_advanced_menu_hamburger_icon'                  => $hamburger_icon,
            'default_eael_advanced_menu_item_indicator'          => $indicator_icon,
            'default_eael_advanced_menu_dropdown_item_indicator' => $indicator_icon,
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

WP_CLI::success( 'Advanced Menu page ready → /' . $slug . '/' );
