<?php
/**
 * Test page: Woo Product List
 * Run via: wp eval-file /scripts/setup-woo-product-list-page.php
 */

if ( ! class_exists( 'WooCommerce' ) ) {
    WP_CLI::warning( 'WooCommerce not active — skipping Woo Product List page setup.' );
    return;
}

// Seed sample products so the widget has data to display.
require_once '/scripts/setup-sample-products.php';

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

// ── Woo Product List page ──────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Product List page ---' );

$slug    = getenv( 'WOO_PRODUCT_LIST_PAGE_SLUG' ) ?: 'woo-product-list';
$page_id = ea_upsert_page( $slug, 'Woo Product List' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Layout Presets
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layout Presets ──', 'h2' ),

    ea_heading( 'Default Woo Product List (Preset 1)' ),
    ea_widget( 'test-wpl-default', 'eael-woo-product-list', [] ),

    ea_heading( 'Woo Product List | Layout: Preset 2' ),
    ea_widget( 'test-wpl-preset-2', 'eael-woo-product-list', [
        'eael_dynamic_template_layout' => 'preset-2',
    ] ),

    ea_heading( 'Woo Product List | Layout: Preset 3' ),
    ea_widget( 'test-wpl-preset-3', 'eael-woo-product-list', [
        'eael_dynamic_template_layout' => 'preset-3',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Image Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Image Alignment ──', 'h2' ),

    ea_heading( 'Woo Product List | Image Alignment: Right' ),
    ea_widget( 'test-wpl-img-right', 'eael-woo-product-list', [
        'eael_product_list_image_alignment' => 'image-alignment-right',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Toggles ──', 'h2' ),

    ea_heading( 'Woo Product List | Rating Hidden' ),
    ea_widget( 'test-wpl-no-rating', 'eael-woo-product-list', [
        'eael_woo_product_list_rating_show' => '',
    ] ),

    ea_heading( 'Woo Product List | Title Hidden' ),
    ea_widget( 'test-wpl-no-title', 'eael-woo-product-list', [
        'eael_woo_product_list_title_show' => '',
    ] ),

    ea_heading( 'Woo Product List | Price Hidden' ),
    ea_widget( 'test-wpl-no-price', 'eael-woo-product-list', [
        'eael_woo_product_list_price_show' => '',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Button Positions
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Button Positions ──', 'h2' ),

    ea_heading( 'Woo Product List | Buttons: Static Only' ),
    ea_widget( 'test-wpl-btn-static', 'eael-woo-product-list', [
        'eael_product_list_content_general_button_position' => 'static',
    ] ),

    ea_heading( 'Woo Product List | Buttons: On Hover Only' ),
    ea_widget( 'test-wpl-btn-hover', 'eael-woo-product-list', [
        'eael_product_list_content_general_button_position' => 'on-hover',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Total Sold Progress Bar
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Total Sold ──', 'h2' ),

    ea_heading( 'Woo Product List | Total Sold Progress Bar' ),
    ea_widget( 'test-wpl-total-sold', 'eael-woo-product-list', [
        'eael_woo_product_list_total_sold_show' => 'yes',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Product Filters
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Product Filters ──', 'h2' ),

    ea_heading( 'Woo Product List | Filter: Featured Products' ),
    ea_widget( 'test-wpl-featured', 'eael-woo-product-list', [
        'eael_product_list_product_filter' => 'featured-products',
    ] ),

    ea_heading( 'Woo Product List | Filter: Sale Products' ),
    ea_widget( 'test-wpl-sale', 'eael-woo-product-list', [
        'eael_product_list_product_filter' => 'sale-products',
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

WP_CLI::success( 'Woo Product List page ready → /' . $slug . '/' );
