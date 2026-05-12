<?php
/**
 * Test page: Woo Cart
 * Run via: wp eval-file /scripts/setup-woo-cart-page.php
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

// ── Woo Cart page ──────────────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Cart page ---' );

$slug    = getenv( 'WOO_CART_PAGE_SLUG' ) ?: 'woo-cart';
$page_id = ea_upsert_page( $slug, 'Woo Cart' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Layouts (Free)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Free Layouts ──', 'h2' ),

    ea_heading( 'Default Woo Cart (Style 1)' ),
    ea_widget( 'test-wc-default', 'eael-woo-cart',
        [
            'ea_woo_cart_layout'              => 'default',
            'eael_woo_cart_auto_cart_update'  => 'yes',
        ]
    ),

    ea_heading( 'Woo Cart | Style 2' ),
    ea_widget( 'test-wc-style-2', 'eael-woo-cart',
        [
            'ea_woo_cart_layout'              => 'style-2',
            'eael_woo_cart_auto_cart_update'  => 'yes',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Cart Components
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Cart Components ──', 'h2' ),

    ea_heading( 'Woo Cart | Auto Update Off' ),
    ea_widget( 'test-wc-no-auto-update', 'eael-woo-cart',
        [
            'ea_woo_cart_layout'              => 'default',
            'eael_woo_cart_auto_cart_update'  => '',
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

WP_CLI::success( 'Woo Cart page ready → /' . $slug . '/' );
