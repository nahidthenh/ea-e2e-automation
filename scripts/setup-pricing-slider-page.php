<?php
/**
 * Test page: Pricing Slider
 * Run via: wp eval-file /scripts/setup-pricing-slider-page.php
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

// - Pricing Slider page --------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Pricing Slider page ---' );

$slug    = getenv( 'PRICING_SLIDER_PAGE_SLUG' ) ?: 'pricing-slider';
$page_id = ea_upsert_page( $slug, 'Pricing Slider' );

// eicons are always registered — avoids Font Awesome dependency in test environment
$icon_check = [ 'value' => 'eicon-check', 'library' => 'eicons' ];
$icon_star  = [ 'value' => 'eicon-star',  'library' => 'eicons' ];

// Base slider controls: 2 positions (Starter → Pro)
$slider_2step = [
    [
        'eael_pricing_slider_title'             => 'Starter',
        'eael_pricing_slider_custom_id'         => '1',
        'eael_pricing_slider_active_as_default' => 'yes',
        'eael_pricing_slider_tooltip_active'    => 'yes',
        'eael_pricing_slider_tooltip_text'      => 'Perfect for beginners',
    ],
    [
        'eael_pricing_slider_title'             => 'Pro',
        'eael_pricing_slider_custom_id'         => '2',
        'eael_pricing_slider_active_as_default' => 'no',
        'eael_pricing_slider_tooltip_active'    => 'yes',
        'eael_pricing_slider_tooltip_text'      => 'For growing teams',
    ],
];

// Base pricing panels: one panel per slider filter ID
$panels_base = [
    [
        'eael_pricing_panel_control_id'          => '1',
        'eael_pricing_panel_title'               => 'Starter Plan',
        'eael_pricing_panel_show_subtitle'       => 'no',
        'eael_pricing_panel_show_badge_icon'     => 'yes',
        'eael_pricing_panel_badge_icon'          => $icon_star,
        'eael_pricing_panel_status_show'         => 'no',
        'eael_pricing_panel_feature_list_number' => [ 'size' => 3 ],
        'eael_pricing_panel_feature_text_1'      => 'Basic Hosting',
        'eael_pricing_panel_feature_text_icon_1' => $icon_check,
        'eael_pricing_panel_feature_text_2'      => 'Email Support',
        'eael_pricing_panel_feature_text_icon_2' => $icon_check,
        'eael_pricing_panel_feature_text_3'      => '5GB Storage',
        'eael_pricing_panel_feature_text_icon_3' => $icon_check,
        'eael_pricing_panel_price_amount'        => '19',
        'eael_pricing_panel_price_currency'      => '$',
        'eael_pricing_panel_price_period'        => '/mo',
        'eael_pricing_panel_price_button_text'   => 'Buy Now',
        'eael_pricing_panel_price_button_link'   => [ 'url' => '#', 'is_external' => '', 'nofollow' => '' ],
    ],
    [
        'eael_pricing_panel_control_id'          => '2',
        'eael_pricing_panel_title'               => 'Pro Plan',
        'eael_pricing_panel_show_subtitle'       => 'no',
        'eael_pricing_panel_show_badge_icon'     => 'yes',
        'eael_pricing_panel_badge_icon'          => $icon_star,
        'eael_pricing_panel_status_show'         => 'no',
        'eael_pricing_panel_feature_list_number' => [ 'size' => 3 ],
        'eael_pricing_panel_feature_text_1'      => 'All Basic Features',
        'eael_pricing_panel_feature_text_icon_1' => $icon_check,
        'eael_pricing_panel_feature_text_2'      => 'Priority Support',
        'eael_pricing_panel_feature_text_icon_2' => $icon_check,
        'eael_pricing_panel_feature_text_3'      => '50GB Storage',
        'eael_pricing_panel_feature_text_icon_3' => $icon_check,
        'eael_pricing_panel_price_amount'        => '49',
        'eael_pricing_panel_price_currency'      => '$',
        'eael_pricing_panel_price_period'        => '/mo',
        'eael_pricing_panel_price_button_text'   => 'Buy Now',
        'eael_pricing_panel_price_button_link'   => [ 'url' => '#', 'is_external' => '', 'nofollow' => '' ],
    ],
];

// Style 2 variant: Pro plan is marked as featured (adds .featured class + badge)
$panels_style2      = $panels_base;
$panels_style2[1]['eael_pricing_panel_show_subtitle'] = 'yes';
$panels_style2[1]['eael_pricing_panel_subtitle']      = 'Most Popular';

// Badge variant: second plan shows subtitle badge
$panels_badge      = $panels_base;
$panels_badge[1]['eael_pricing_panel_show_subtitle'] = 'yes';
$panels_badge[1]['eael_pricing_panel_subtitle']      = 'Best Value';

// Sale price variant: first plan has original price struck-through
$panels_sale      = $panels_base;
$panels_sale[0]['eael_pricing_panel_sale_price_on']     = 'yes';
$panels_sale[0]['eael_pricing_panel_sale_price_amount'] = '4.99';

// Status + tooltip variant: first plan shows status title and info tooltip
$panels_status      = $panels_base;
$panels_status[0]['eael_pricing_panel_status_show']  = 'yes';
$panels_status[0]['eael_pricing_panel_status_title'] = '3 Websites';
$panels_status[0]['eael_pricing_panel_tooptip']      = 'yes';
$panels_status[0]['eael_pricing_panel_tooptip_text'] = 'Starter tier: up to 3 websites';

// External link variant: first plan buy button opens in new tab
$panels_ext      = $panels_base;
$panels_ext[0]['eael_pricing_panel_price_button_link'] = [
    'url' => 'https://essential-addons.com/', 'is_external' => 'on', 'nofollow' => '',
];

// Nofollow variant: first plan buy button has nofollow rel
$panels_nofollow      = $panels_base;
$panels_nofollow[0]['eael_pricing_panel_price_button_link'] = [
    'url' => '#', 'is_external' => '', 'nofollow' => 'on',
];

$widgets = [

    // ====================================================================
    // Styles / Presets
    // ====================================================================

    ea_heading( '- Styles / Presets -', 'h2' ),

    ea_heading( 'Default Pricing Slider (Style 1)' ),
    ea_widget( 'test-ps-style-1', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_1',
        'eael_pricing_slider_show_description' => 'yes',
        'eael_pricing_slider_description'      => 'Choose the plan that suits your needs.',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_base,
    ] ),

    ea_heading( 'Pricing Slider | Style 2 (Preset 2, featured plan)' ),
    ea_widget( 'test-ps-style-2', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_2',
        'eael_pricing_slider_show_description' => 'yes',
        'eael_pricing_slider_description'      => 'Upgrade your experience with Style 2.',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_style2,
    ] ),

    // ====================================================================
    // Description Control
    // ====================================================================

    ea_heading( '- Description Control -', 'h2' ),

    ea_heading( 'Pricing Slider | Description: Hidden' ),
    ea_widget( 'test-ps-no-desc', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_1',
        'eael_pricing_slider_show_description' => '',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_base,
    ] ),

    // ====================================================================
    // Plan Features
    // ====================================================================

    ea_heading( '- Plan Features -', 'h2' ),

    ea_heading( 'Pricing Slider | Plan Badge (subtitle visible)' ),
    ea_widget( 'test-ps-badge', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_1',
        'eael_pricing_slider_show_description' => '',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_badge,
    ] ),

    ea_heading( 'Pricing Slider | Sale Price On' ),
    ea_widget( 'test-ps-sale-price', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_1',
        'eael_pricing_slider_show_description' => '',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_sale,
    ] ),

    ea_heading( 'Pricing Slider | Status + Info Tooltip' ),
    ea_widget( 'test-ps-status-tooltip', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_1',
        'eael_pricing_slider_show_description' => '',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_status,
    ] ),

    // ====================================================================
    // Link Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Pricing Slider | External Link (target=_blank)' ),
    ea_widget( 'test-ps-link-external', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_1',
        'eael_pricing_slider_show_description' => '',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_ext,
    ] ),

    ea_heading( 'Pricing Slider | Nofollow Link' ),
    ea_widget( 'test-ps-link-nofollow', 'eael-pricing-slider', [
        'eael_pricing_slider_style'            => 'style_1',
        'eael_pricing_slider_show_description' => '',
        'eael_pricing_slider_title_list'       => $slider_2step,
        'eael_pricing_panels_list'             => $panels_nofollow,
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

WP_CLI::success( 'Pricing Slider page ready → /pricing-slider/' );
