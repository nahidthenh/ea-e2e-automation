<?php
/**
 * Test page: Woo Collections
 * Run via: wp eval-file /scripts/setup-woo-collections-page.php
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

// ── Woo Collections page ───────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Collections page ---' );

// Resolve the "Clothing" product_cat term so the widget can display a real name.
$clothing_term = get_term_by( 'name', 'Clothing', 'product_cat' );
$clothing_id   = $clothing_term ? (string) $clothing_term->term_id : '';

if ( empty( $clothing_id ) ) {
    WP_CLI::warning( 'product_cat "Clothing" not found — category instances will show fallback "Collection Name".' );
}

$slug    = getenv( 'WOO_COLLECTIONS_PAGE_SLUG' ) ?: 'woo-collections';
$page_id = ea_upsert_page( $slug, 'Woo Collections' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Layouts
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layouts ──', 'h2' ),

    ea_heading( 'Woo Collections | Default Style (no category)' ),
    ea_widget( 'test-wcol-default', 'eael-woo-collections', [
        'eael_woo_collections_layout'   => '',
        'eael_woo_collections_subtitle' => 'Collections',
    ] ),

    ea_heading( 'Woo Collections | Style Two' ),
    ea_widget( 'test-wcol-style-two', 'eael-woo-collections', [
        'eael_woo_collections_layout'   => 'two',
        'eael_woo_collections_subtitle' => 'Collections',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Collection Type — Category with resolved term
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Collection Type ──', 'h2' ),

    ea_heading( 'Woo Collections | Type: Category (Clothing)' ),
    ea_widget( 'test-wcol-category', 'eael-woo-collections', [
        'eael_woo_collections_type'     => 'category',
        'eael_woo_collections_category' => $clothing_id,
        'eael_woo_collections_subtitle' => 'Shop Now',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Badge Toggle
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Badge ──', 'h2' ),

    ea_heading( 'Woo Collections | Badge: Shown (label = New)' ),
    ea_widget( 'test-wcol-badge', 'eael-woo-collections', [
        'eael_woo_collections_layout'         => '',
        'eael_woo_collections_subtitle'        => 'Collections',
        'eael_woo_collections_is_show_badge'   => 'yes',
        'eael_woo_collections_badge_label'     => 'New',
    ] ),

    ea_heading( 'Woo Collections | Badge: Hidden (default)' ),
    ea_widget( 'test-wcol-no-badge', 'eael-woo-collections', [
        'eael_woo_collections_layout'   => '',
        'eael_woo_collections_subtitle' => 'Collections',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Horizontal Overlay Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Horizontal Alignment ──', 'h2' ),

    ea_heading( 'Woo Collections | HR Align: Center' ),
    ea_widget( 'test-wcol-align-center', 'eael-woo-collections', [
        'eael_woo_collections_layout'               => '',
        'eael_woo_collections_subtitle'              => 'Collections',
        'eael_woo_collections_overlay_content_hr'   => 'eael-woo-collections-overlay-center',
    ] ),

    ea_heading( 'Woo Collections | HR Align: Right' ),
    ea_widget( 'test-wcol-align-right', 'eael-woo-collections', [
        'eael_woo_collections_layout'               => '',
        'eael_woo_collections_subtitle'              => 'Collections',
        'eael_woo_collections_overlay_content_hr'   => 'eael-woo-collections-overlay-right',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Vertical Overlay Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Vertical Alignment ──', 'h2' ),

    ea_heading( 'Woo Collections | VR Align: Top' ),
    ea_widget( 'test-wcol-vr-top', 'eael-woo-collections', [
        'eael_woo_collections_layout'               => '',
        'eael_woo_collections_subtitle'              => 'Collections',
        'eael_woo_collections_overlay_content_vr'   => 'eael-woo-collections-overlay-inner-top',
    ] ),

    ea_heading( 'Woo Collections | VR Align: Middle' ),
    ea_widget( 'test-wcol-vr-middle', 'eael-woo-collections', [
        'eael_woo_collections_layout'               => '',
        'eael_woo_collections_subtitle'              => 'Collections',
        'eael_woo_collections_overlay_content_vr'   => 'eael-woo-collections-overlay-inner-middle',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Background Hover Effects
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── BG Hover Effects ──', 'h2' ),

    ea_heading( 'Woo Collections | Hover: Blur' ),
    ea_widget( 'test-wcol-hover-blur', 'eael-woo-collections', [
        'eael_woo_collections_layout'            => '',
        'eael_woo_collections_subtitle'           => 'Collections',
        'eael_woo_collections_bg_hover_effect'   => 'eael-woo-collections-bg-hover-blur',
    ] ),

    ea_heading( 'Woo Collections | Hover: Zoom Out' ),
    ea_widget( 'test-wcol-hover-zoom-out', 'eael-woo-collections', [
        'eael_woo_collections_layout'            => '',
        'eael_woo_collections_subtitle'           => 'Collections',
        'eael_woo_collections_bg_hover_effect'   => 'eael-woo-collections-bg-hover-zoom-out',
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

WP_CLI::success( 'Woo Collections page ready → /' . $slug . '/' );
