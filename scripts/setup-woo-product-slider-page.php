<?php
/**
 * Test page: Woo Product Slider
 * Run via: wp eval-file /scripts/setup-woo-product-slider-page.php
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

// - Woo Product Slider page ------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Product Slider page ---' );

$slug    = getenv( 'WOO_PRODUCT_SLIDER_PAGE_SLUG' ) ?: 'woo-product-slider';
$page_id = ea_upsert_page( $slug, 'Woo Product Slider' );

$widgets = [

    // ====================================================================
    // Layout Presets
    // ====================================================================

    ea_heading( '- Layout Presets -', 'h2' ),

    ea_heading( 'Default Woo Product Slider (Preset 1)' ),
    ea_widget( 'test-wps-default', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
        ]
    ),

    ea_heading( 'Woo Product Slider | Layout: Preset 2' ),
    ea_widget( 'test-wps-preset-2', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-2',
            'eael_product_slider_product_filter' => 'recent-products',
        ]
    ),

    ea_heading( 'Woo Product Slider | Layout: Preset 3' ),
    ea_widget( 'test-wps-preset-3', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-3',
            'eael_product_slider_product_filter' => 'recent-products',
        ]
    ),

    ea_heading( 'Woo Product Slider | Layout: Preset 4' ),
    ea_widget( 'test-wps-preset-4', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-4',
            'eael_product_slider_product_filter' => 'recent-products',
        ]
    ),

    // ====================================================================
    // Content Toggles
    // ====================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'Woo Product Slider | Title: Hidden' ),
    ea_widget( 'test-wps-no-title', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
            'eael_product_slider_show_title'     => '',
        ]
    ),

    ea_heading( 'Woo Product Slider | Price: Hidden' ),
    ea_widget( 'test-wps-no-price', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
            'eael_product_slider_price'          => '',
        ]
    ),

    ea_heading( 'Woo Product Slider | Rating: Hidden' ),
    ea_widget( 'test-wps-no-rating', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
            'eael_product_slider_rating'         => '',
        ]
    ),

    ea_heading( 'Woo Product Slider | Post Terms: Shown' ),
    ea_widget( 'test-wps-terms', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
            'eael_show_post_terms'               => 'yes',
            'eael_post_terms'                    => 'product_cat',
        ]
    ),

    // ====================================================================
    // Slider Controls
    // ====================================================================

    ea_heading( '- Slider Controls -', 'h2' ),

    ea_heading( 'Woo Product Slider | Arrows: On' ),
    ea_widget( 'test-wps-arrows', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
            'arrows'                             => 'yes',
        ]
    ),

    ea_heading( 'Woo Product Slider | Autoplay: On' ),
    ea_widget( 'test-wps-autoplay', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
            'autoplay'                           => 'yes',
            'autoplay_speed'                     => [ 'size' => 3000 ],
        ]
    ),

    ea_heading( 'Woo Product Slider | Loop: Off' ),
    ea_widget( 'test-wps-no-loop', 'eael-woo-product-slider',
        [
            'eael_dynamic_template_layout'       => 'preset-1',
            'eael_product_slider_product_filter' => 'recent-products',
            'infinite_loop'                      => '',
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

WP_CLI::success( 'Woo Product Slider page ready → /woo-product-slider/' );
