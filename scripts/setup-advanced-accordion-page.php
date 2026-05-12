<?php
/**
 * Test page: Advanced Accordion
 * Run via: wp eval-file /scripts/setup-advanced-accordion-page.php
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

// - Advanced Accordion page ------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Advanced Accordion page ---' );

$slug    = getenv( 'ADVANCED_ACCORDION_PAGE_SLUG' ) ?: 'advanced-accordion';
$page_id = ea_upsert_page( $slug, 'Advanced Accordion' );

// eicons are always registered — avoids FA dependency in test environment
$icon_plus  = [ 'value' => 'eicon-plus',  'library' => 'eicons' ];
$icon_minus = [ 'value' => 'eicon-minus', 'library' => 'eicons' ];
$toggle_icon = [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ];

// Shared tab definitions with eicons and verifiable content
$tabs = [
    [
        'eael_adv_accordion_tab_title'                 => 'Tab One',
        'eael_adv_accordion_tab_content'               => 'Content for tab one.',
        'eael_adv_accordion_tab_icon_show'             => 'yes',
        'eael_adv_accordion_tab_title_icon_new'        => $icon_plus,
        'eael_adv_accordion_tab_title_icon_new_opened' => $icon_minus,
    ],
    [
        'eael_adv_accordion_tab_title'                 => 'Tab Two',
        'eael_adv_accordion_tab_content'               => 'Content for tab two.',
        'eael_adv_accordion_tab_icon_show'             => 'yes',
        'eael_adv_accordion_tab_title_icon_new'        => $icon_plus,
        'eael_adv_accordion_tab_title_icon_new_opened' => $icon_minus,
    ],
    [
        'eael_adv_accordion_tab_title'                 => 'Tab Three',
        'eael_adv_accordion_tab_content'               => 'Content for tab three.',
        'eael_adv_accordion_tab_icon_show'             => 'yes',
        'eael_adv_accordion_tab_title_icon_new'        => $icon_plus,
        'eael_adv_accordion_tab_title_icon_new_opened' => $icon_minus,
    ],
];

// Tabs without per-tab icons (for icon-off test)
$tabs_no_tab_icon = array_map( function( $tab ) {
    $tab['eael_adv_accordion_tab_icon_show'] = '';
    return $tab;
}, $tabs );

// Tabs with first item set as default-active
$tabs_first_active = $tabs;
$tabs_first_active[0]['eael_adv_accordion_tab_default_active'] = 'yes';

$widgets = [

    // ====================================================================
    // Accordion Types
    // 'accordion' closes other tabs when one opens; 'toggle' each tab
    // toggles independently. data-accordion-type attribute encodes the type.
    // ====================================================================

    ea_heading( '- Accordion Types -', 'h2' ),

    ea_heading( 'Default Advanced Accordion' ),
    ea_widget( 'test-aa-default', 'eael-adv-accordion', [
        'eael_adv_accordion_type'     => 'accordion',
        'eael_adv_accordion_icon_new' => $toggle_icon,
        'eael_adv_accordion_tab'      => $tabs,
    ] ),

    ea_heading( 'Advanced Accordion | Type: Toggle' ),
    ea_widget( 'test-aa-toggle', 'eael-adv-accordion', [
        'eael_adv_accordion_type'     => 'toggle',
        'eael_adv_accordion_icon_new' => $toggle_icon,
        'eael_adv_accordion_tab'      => $tabs,
    ] ),

    // ====================================================================
    // Toggle Icon Variants
    // ====================================================================

    ea_heading( '- Toggle Icon -', 'h2' ),

    ea_heading( 'Advanced Accordion | Toggle Icon: Off' ),
    ea_widget( 'test-aa-icon-off', 'eael-adv-accordion', [
        'eael_adv_accordion_type'          => 'accordion',
        'eael_adv_accordion_icon_show'     => '',
        'eael_adv_accordion_icon_new'      => $toggle_icon,
        'eael_adv_accordion_tab'           => $tabs,
    ] ),

    ea_heading( 'Advanced Accordion | Toggle Icon Position: Left' ),
    ea_widget( 'test-aa-icon-left', 'eael-adv-accordion', [
        'eael_adv_accordion_type'                   => 'accordion',
        'eael_adv_accordion_icon_show'              => 'yes',
        'eael_adv_accordion_toggle_icon_postion'    => '',
        'eael_adv_accordion_icon_new'               => $toggle_icon,
        'eael_adv_accordion_tab'                    => $tabs,
    ] ),

    ea_heading( 'Advanced Accordion | Per-Tab Icon: Off' ),
    ea_widget( 'test-aa-tab-icon-off', 'eael-adv-accordion', [
        'eael_adv_accordion_type'     => 'accordion',
        'eael_adv_accordion_icon_new' => $toggle_icon,
        'eael_adv_accordion_tab'      => $tabs_no_tab_icon,
    ] ),

    // ====================================================================
    // Default Active Tab
    // ====================================================================

    ea_heading( '- Default Active Tab -', 'h2' ),

    ea_heading( 'Advanced Accordion | First Tab Default Active' ),
    ea_widget( 'test-aa-active-default', 'eael-adv-accordion', [
        'eael_adv_accordion_type'     => 'accordion',
        'eael_adv_accordion_icon_new' => $toggle_icon,
        'eael_adv_accordion_tab'      => $tabs_first_active,
    ] ),

    // ====================================================================
    // Title Tag
    // ====================================================================

    ea_heading( '- Title Tag -', 'h2' ),

    ea_heading( 'Advanced Accordion | Title Tag: H3' ),
    ea_widget( 'test-aa-h3-title', 'eael-adv-accordion', [
        'eael_adv_accordion_type'      => 'accordion',
        'eael_adv_accordion_title_tag' => 'h3',
        'eael_adv_accordion_icon_new'  => $toggle_icon,
        'eael_adv_accordion_tab'       => $tabs,
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

WP_CLI::success( 'Advanced Accordion page ready → /advanced-accordion/' );
