<?php
/**
 * Test page: Interactive Circle
 * Run via: wp eval-file /scripts/setup-interactive-circle-page.php
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

// - Interactive Circle page ------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Interactive Circle page ---' );

$slug    = getenv( 'INTERACTIVE_CIRCLE_PAGE_SLUG' ) ?: 'interactive-circle';
$page_id = ea_upsert_page( $slug, 'Interactive Circle' );

// Shared repeater items used by most instances.
$default_items = [
    [
        'eael_interactive_circle_default_active' => 'yes',
        'eael_interactive_circle_btn_icon'       => [ 'value' => 'eicon-home', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'      => 'Home',
        'eael_interactive_circle_item_content'   => 'Home tab content for the interactive circle.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-info', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Info',
        'eael_interactive_circle_item_content' => 'Info tab content for the interactive circle.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-map-pin', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Location',
        'eael_interactive_circle_item_content' => 'Location tab content for the interactive circle.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Star',
        'eael_interactive_circle_item_content' => 'Star tab content for the interactive circle.',
    ],
];

// Items with content icons (preset-2 content icon variant).
$content_icon_items = [
    [
        'eael_interactive_circle_default_active' => 'yes',
        'eael_interactive_circle_btn_icon'       => [ 'value' => 'eicon-home', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'      => 'Home',
        'eael_interactive_circle_content_icon'   => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        'eael_interactive_circle_item_content'   => 'Home content with icon.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-info', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Info',
        'eael_interactive_circle_content_icon' => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        'eael_interactive_circle_item_content' => 'Info content with icon.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-map-pin', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Location',
        'eael_interactive_circle_content_icon' => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        'eael_interactive_circle_item_content' => 'Location content with icon.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Star',
        'eael_interactive_circle_content_icon' => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        'eael_interactive_circle_item_content' => 'Star content with icon.',
    ],
];

// Items with a linked button on the first item.
$link_items = [
    [
        'eael_interactive_circle_default_active' => 'yes',
        'eael_interactive_circle_btn_icon'       => [ 'value' => 'eicon-link', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'      => 'Visit',
        'eael_interactive_circle_btn_link_on'    => 'yes',
        'eael_interactive_circle_btn_link'       => [
            'url'               => 'https://essential-addons.com',
            'is_external'       => 'on',
            'nofollow'          => '',
            'custom_attributes' => '',
        ],
        'eael_interactive_circle_item_content' => 'External link item content.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-info', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Info',
        'eael_interactive_circle_item_content' => 'Regular item content.',
    ],
    [
        'eael_interactive_circle_btn_icon'     => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        'eael_interactive_circle_btn_title'    => 'Star',
        'eael_interactive_circle_item_content' => 'Star item content.',
    ],
];

$widgets = [

    // ====================================================================
    // Presets
    // ====================================================================

    ea_heading( '- Presets -', 'h2' ),

    ea_heading( 'Default Interactive Circle' ),
    ea_widget( 'test-ic-default', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-1',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    ea_heading( 'Interactive Circle | Preset 2' ),
    ea_widget( 'test-ic-preset-2', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-2',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    ea_heading( 'Interactive Circle | Preset 3' ),
    ea_widget( 'test-ic-preset-3', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-3',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    ea_heading( 'Interactive Circle | Preset 4' ),
    ea_widget( 'test-ic-preset-4', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-4',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    // ====================================================================
    // Button Visibility
    // ====================================================================

    ea_heading( '- Button Visibility -', 'h2' ),

    ea_heading( 'Interactive Circle | Button Icon: Off' ),
    ea_widget( 'test-ic-btn-icon-off', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-1',
            'eael_interactive_circle_btn_icon_show' => '',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    ea_heading( 'Interactive Circle | Button Text: Off' ),
    ea_widget( 'test-ic-btn-text-off', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-1',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => '',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    // ====================================================================
    // Content Icon (Preset 2 only)
    // ====================================================================

    ea_heading( '- Content Icon (Preset 2) -', 'h2' ),

    ea_heading( 'Interactive Circle | Content Icon: On' ),
    ea_widget( 'test-ic-content-icon', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'              => 'eael-interactive-circle-preset-2',
            'eael_interactive_circle_btn_icon_show'       => 'yes',
            'eael_interactive_circle_btn_text_show'       => 'yes',
            'eael_interactive_circle_content_icon_show'   => 'yes',
            'eael_interactive_circle_item'                => $content_icon_items,
        ]
    ),

    // ====================================================================
    // Event & Animation
    // ====================================================================

    ea_heading( '- Event & Animation -', 'h2' ),

    ea_heading( 'Interactive Circle | Event: Hover' ),
    ea_widget( 'test-ic-event-hover', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-1',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_event'         => 'eael-interactive-circle-event-hover',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    ea_heading( 'Interactive Circle | Rotation: On' ),
    ea_widget( 'test-ic-rotation', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-1',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_rotation'      => 'yes',
            'eael_interactive_circle_item'          => $default_items,
        ]
    ),

    // ====================================================================
    // Item Link
    // ====================================================================

    ea_heading( '- Item Link -', 'h2' ),

    ea_heading( 'Interactive Circle | Item With External Link' ),
    ea_widget( 'test-ic-link', 'eael-interactive-circle',
        [
            'eael_interactive_circle_preset'        => 'eael-interactive-circle-preset-1',
            'eael_interactive_circle_btn_icon_show' => 'yes',
            'eael_interactive_circle_btn_text_show' => 'yes',
            'eael_interactive_circle_item'          => $link_items,
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

WP_CLI::success( 'Interactive Circle page ready → /interactive-circle/' );
