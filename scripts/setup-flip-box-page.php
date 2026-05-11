<?php
/**
 * Test page: Flip Box
 * Run via: wp eval-file /scripts/setup-flip-box-page.php
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

// ── Flip Box page ─────────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Flip Box page ---' );

$slug    = getenv( 'FLIP_BOX_PAGE_SLUG' ) ?: 'flip-box';
$page_id = ea_upsert_page( $slug, 'Flip Box' );

// eicons are always registered; avoids FA dependency in test environment
$icon     = [ 'value' => 'eicon-star', 'library' => 'eicons' ];
$icon_back = [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ];
$img      = [ 'url' => \Elementor\Utils::get_placeholder_image_src(), 'id' => 0 ];

$default_settings = [
    'eael_flipbox_icon_new'      => $icon,
    'eael_flipbox_icon_back_new' => $icon_back,
    'eael_flipbox_front_title'   => 'Front Title',
    'eael_flipbox_back_title'    => 'Back Title',
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Flip Types
    // Each animates differently; the type class is applied to the container.
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Flip Types ──', 'h2' ),

    ea_heading( 'Default Flip Box (Flip Left)' ),
    ea_widget( 'test-fb-default', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_type' => 'animate-left',
    ] ) ),

    ea_heading( 'Flip Box | Flip Right' ),
    ea_widget( 'test-fb-right', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_type' => 'animate-right',
    ] ) ),

    ea_heading( 'Flip Box | Flip Top' ),
    ea_widget( 'test-fb-up', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_type' => 'animate-up',
    ] ) ),

    ea_heading( 'Flip Box | Flip Bottom' ),
    ea_widget( 'test-fb-down', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_type' => 'animate-down',
    ] ) ),

    ea_heading( 'Flip Box | Zoom In' ),
    ea_widget( 'test-fb-zoom-in', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_type' => 'animate-zoom-in',
    ] ) ),

    ea_heading( 'Flip Box | Zoom Out' ),
    ea_widget( 'test-fb-zoom-out', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_type' => 'animate-zoom-out',
    ] ) ),

    ea_heading( 'Flip Box | Fade In' ),
    ea_widget( 'test-fb-fade-in', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_type' => 'animate-fade-in',
    ] ) ),

    // ══════════════════════════════════════════════════════════════════════
    // Event Type
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Event Type ──', 'h2' ),

    ea_heading( 'Flip Box | Event: Click' ),
    ea_widget( 'test-fb-click', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_event_type' => 'click',
    ] ) ),

    // ══════════════════════════════════════════════════════════════════════
    // Front Icon Types
    // Default is 'icon'; tested in test-fb-default.
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Front Icon Types ──', 'h2' ),

    ea_heading( 'Flip Box | Front Icon: None' ),
    ea_widget( 'test-fb-icon-none', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_img_or_icon' => 'none',
    ] ) ),

    ea_heading( 'Flip Box | Front Icon: Image' ),
    ea_widget( 'test-fb-icon-img', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_img_or_icon' => 'img',
        'eael_flipbox_image'       => $img,
    ] ) ),

    // ══════════════════════════════════════════════════════════════════════
    // Link Types
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Link Types ──', 'h2' ),

    ea_heading( 'Flip Box | Link Type: Box' ),
    ea_widget( 'test-fb-link-box', 'eael-flip-box', array_merge( $default_settings, [
        'flipbox_link_type' => 'box',
        'flipbox_link'      => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ] ) ),

    ea_heading( 'Flip Box | Link Type: Title' ),
    ea_widget( 'test-fb-link-title', 'eael-flip-box', array_merge( $default_settings, [
        'flipbox_link_type' => 'title',
        'flipbox_link'      => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ] ) ),

    ea_heading( 'Flip Box | Link Type: Button' ),
    ea_widget( 'test-fb-link-btn', 'eael-flip-box', array_merge( $default_settings, [
        'flipbox_link_type'   => 'button',
        'flipbox_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'flipbox_button_text' => 'Get Started',
    ] ) ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Alignment (prefix_class: eael-flipbox-content-align-)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Alignment ──', 'h2' ),

    ea_heading( 'Flip Box | Alignment: Left' ),
    ea_widget( 'test-fb-align-left', 'eael-flip-box', array_merge( $default_settings, [
        'eael_flipbox_content_alignment' => 'left',
    ] ) ),

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

WP_CLI::success( 'Flip Box page ready → /flip-box/' );
