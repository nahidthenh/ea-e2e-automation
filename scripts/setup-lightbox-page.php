<?php
/**
 * Test page: Lightbox
 * Run via: wp eval-file /scripts/setup-lightbox-page.php
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

// ── Lightbox page ──────────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Lightbox page ---' );

$slug    = getenv( 'LIGHTBOX_PAGE_SLUG' ) ?: 'lightbox';
$page_id = ea_upsert_page( $slug, 'Lightbox' );

// Elementor's built-in placeholder — always present in the container.
$placeholder = get_site_url() . '/wp-content/plugins/elementor/assets/images/placeholder.png';

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Default / Baseline
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Default / Baseline ──', 'h2' ),

    ea_heading( 'Default Lightbox' ),
    ea_widget( 'test-lb-default', 'eael-lightbox',
        [
            // All defaults: image type, button trigger, "Open Popup" text.
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Types
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Types ──', 'h2' ),

    ea_heading( 'Lightbox | Type: Content' ),
    ea_widget( 'test-lb-type-content', 'eael-lightbox',
        [
            'eael_lightbox_type'         => 'lightbox_type_content',
            'eael_lightbox_type_content' => 'This is test content for the lightbox popup.',
        ]
    ),

    ea_heading( 'Lightbox | Type: URL (iFrame)' ),
    ea_widget( 'test-lb-type-url', 'eael-lightbox',
        [
            'eael_lightbox_type'     => 'lightbox_type_url',
            'eael_lightbox_type_url' => [
                'url'               => 'https://www.youtube.com/watch?v=Y2Xt0RE9HDQ',
                'is_external'       => '',
                'nofollow'          => '',
                'custom_attributes' => '',
            ],
        ]
    ),

    ea_heading( 'Lightbox | Type: Custom HTML' ),
    ea_widget( 'test-lb-type-custom-html', 'eael-lightbox',
        [
            'eael_lightbox_type' => 'lightbox_type_custom_html',
            'custom_html'        => '<p>Custom HTML Content</p>',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Trigger Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Trigger Variants ──', 'h2' ),

    ea_heading( 'Lightbox | Trigger: Text Link' ),
    ea_widget( 'test-lb-trigger-text', 'eael-lightbox',
        [
            'trigger_type'             => 'text',
            'eael_lightbox_open_btn'   => 'Click to Open',
        ]
    ),

    ea_heading( 'Lightbox | Trigger: Icon' ),
    ea_widget( 'test-lb-trigger-icon', 'eael-lightbox',
        [
            'trigger_type'           => 'icon',
            'trigger_only_icon_new'  => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        ]
    ),

    ea_heading( 'Lightbox | Trigger: Image' ),
    ea_widget( 'test-lb-trigger-image', 'eael-lightbox',
        [
            'trigger_type'        => 'image',
            'trigger_only_image'  => [ 'url' => $placeholder ],
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Layout
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layout ──', 'h2' ),

    ea_heading( 'Lightbox | Layout: Fullscreen' ),
    ea_widget( 'test-lb-layout-fullscreen', 'eael-lightbox',
        [
            'layout_type' => 'fullscreen',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Feature Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Feature Toggles ──', 'h2' ),

    ea_heading( 'Lightbox | Title: Enabled' ),
    ea_widget( 'test-lb-title-on', 'eael-lightbox',
        [
            'eael_lightbox_type'         => 'lightbox_type_content',
            'popup_lightbox_title'       => 'yes',
            'title'                      => 'Popup Title Text',
            'eael_lightbox_type_content' => 'Content with title visible.',
        ]
    ),

    ea_heading( 'Lightbox | Close Button: Disabled' ),
    ea_widget( 'test-lb-no-close', 'eael-lightbox',
        [
            'close_button' => '',
        ]
    ),

    ea_heading( 'Lightbox | Animation: Zoom-In' ),
    ea_widget( 'test-lb-animation-zoom', 'eael-lightbox',
        [
            'lightbox_modal_animation_in' => 'mfp-zoom-in',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Trigger Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Trigger Alignment ──', 'h2' ),

    ea_heading( 'Lightbox | Align: Center' ),
    ea_widget( 'test-lb-align-center', 'eael-lightbox',
        [
            'eael_lightbox_open_btn_alignment' => 'center',
        ]
    ),

    ea_heading( 'Lightbox | Align: Right' ),
    ea_widget( 'test-lb-align-right', 'eael-lightbox',
        [
            'eael_lightbox_open_btn_alignment' => 'flex-end',
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

WP_CLI::success( 'Lightbox page ready → /' . $slug . '/' );
