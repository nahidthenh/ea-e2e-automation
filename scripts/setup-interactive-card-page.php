<?php
/**
 * Test page: Interactive Card
 * Run via: wp eval-file /scripts/setup-interactive-card-page.php
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

// - Interactive Card page -------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Interactive Card page ---' );

$slug    = getenv( 'INTERACTIVE_CARD_PAGE_SLUG' ) ?: 'interactive-card';
$page_id = ea_upsert_page( $slug, 'Interactive Card' );

$widgets = [

    // ====================================================================
    // Front Styles
    // ====================================================================

    ea_heading( '- Front Styles -', 'h2' ),

    ea_heading( 'Default Interactive Card (Text Card)' ),
    ea_widget( 'test-icard-default', 'eael-interactive-card',
        [
            // text-card + img-grid — all defaults render without extra settings
        ]
    ),

    ea_heading( 'Interactive Card | Image Card' ),
    ea_widget( 'test-icard-img-card', 'eael-interactive-card',
        [
            'eael_interactive_card_style' => 'img-card',
        ]
    ),

    // ====================================================================
    // Rear Panel Types
    // ====================================================================

    ea_heading( '- Rear Panel Types -', 'h2' ),

    ea_heading( 'Interactive Card | Rear: Scrollable' ),
    ea_widget( 'test-icard-scrollable', 'eael-interactive-card',
        [
            'eael_interactive_card_type'             => 'scrollable',
            'eael_interactive_card_rear_custom_code' => '<h2>Scrollable Heading</h2><p>Scrollable rear content for testing the Interactive Card widget.</p>',
        ]
    ),

    ea_heading( 'Interactive Card | Rear: Video (YouTube)' ),
    ea_widget( 'test-icard-video', 'eael-interactive-card',
        [
            'eael_interactive_card_type' => 'video',
        ]
    ),

    // ====================================================================
    // Button & Icon
    // ====================================================================

    ea_heading( '- Button & Icon -', 'h2' ),

    ea_heading( 'Interactive Card | Front Btn Icon: On (Left)' ),
    ea_widget( 'test-icard-front-btn-icon', 'eael-interactive-card',
        [
            'eael_interactive_card_is_show_front_panel_btn_icon'       => 'yes',
            'eael_interactive_card_front_panel_btn_icon_alignment'     => 'left',
            'eael_interactive_card_front_panel_btn_icon'               => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        ]
    ),

    ea_heading( 'Interactive Card | Rear Btn Icon: On (Left)' ),
    ea_widget( 'test-icard-rear-btn-icon', 'eael-interactive-card',
        [
            'eael_interactive_card_is_show_rear_panel_btn_icon'        => 'yes',
            'eael_interactive_card_rear_panel_btn_icon_alignment'      => 'left',
            'eael_interactive_card_rear_panel_btn_icon'                => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        ]
    ),

    // ====================================================================
    // Link Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Interactive Card | Rear Link: External (target=_blank)' ),
    ea_widget( 'test-icard-link-ext', 'eael-interactive-card',
        [
            'eael_interactive_card_rear_btn_link' => [
                'url'               => 'https://essential-addons.com',
                'is_external'       => 'on',
                'nofollow'          => '',
                'custom_attributes' => '',
            ],
        ]
    ),

    ea_heading( 'Interactive Card | Rear Link: Nofollow' ),
    ea_widget( 'test-icard-link-nofollow', 'eael-interactive-card',
        [
            'eael_interactive_card_rear_btn_link' => [
                'url'               => '#',
                'is_external'       => '',
                'nofollow'          => 'on',
                'custom_attributes' => '',
            ],
        ]
    ),

    // ====================================================================
    // Content Animation
    // ====================================================================

    ea_heading( '- Content Animation -', 'h2' ),

    ea_heading( 'Interactive Card | Animation: Slide In Left' ),
    ea_widget( 'test-icard-anim-left', 'eael-interactive-card',
        [
            'eael_interactive_card_content_animation' => 'slide-in-left',
        ]
    ),

    ea_heading( 'Interactive Card | Animation: Slide In Right' ),
    ea_widget( 'test-icard-anim-right', 'eael-interactive-card',
        [
            'eael_interactive_card_content_animation' => 'slide-in-right',
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

WP_CLI::success( 'Interactive Card page ready → /interactive-card/' );
