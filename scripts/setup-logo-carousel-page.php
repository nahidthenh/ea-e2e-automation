<?php
/**
 * Test page: Logo Carousel
 * Run via: wp eval-file /scripts/setup-logo-carousel-page.php
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

// - Logo Carousel page ---------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Logo Carousel page ---' );

$slug    = getenv( 'LOGO_CAROUSEL_PAGE_SLUG' ) ?: 'logo-carousel';
$page_id = ea_upsert_page( $slug, 'Logo Carousel' );

// Elementor's built-in placeholder — always present in the container.
$placeholder = get_site_url() . '/wp-content/plugins/elementor/assets/images/placeholder.png';

// Five logo slides used across all test configurations (titles hidden by default).
$logos_default = [
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Acme Corp',    'hide_logo_title' => 'yes' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Beta Inc',     'hide_logo_title' => 'yes' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Gamma LLC',    'hide_logo_title' => 'yes' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Delta Co',     'hide_logo_title' => 'yes' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Epsilon Group', 'hide_logo_title' => 'yes' ],
];

// Slides with visible titles — used for the title-visible test.
$logos_titled = [
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Acme Corp',    'hide_logo_title' => '' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Beta Inc',     'hide_logo_title' => '' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Gamma LLC',    'hide_logo_title' => '' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Delta Co',     'hide_logo_title' => '' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Epsilon Group', 'hide_logo_title' => '' ],
];

// Slides with external links.
$logos_linked_external = [
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'EA Site', 'hide_logo_title' => 'yes',
      'link' => [ 'url' => 'https://essential-addons.com/', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ] ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'WP Dev',  'hide_logo_title' => 'yes',
      'link' => [ 'url' => 'https://wpdeveloper.com/', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ] ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Demo',    'hide_logo_title' => 'yes',
      'link' => [ 'url' => 'https://example.com/', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ] ],
];

// Slides with nofollow links.
$logos_linked_nofollow = [
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Brand A', 'hide_logo_title' => 'yes',
      'link' => [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ] ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Brand B', 'hide_logo_title' => 'yes',
      'link' => [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ] ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Brand C', 'hide_logo_title' => 'yes',
      'link' => [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ] ],
];

// Slides with tooltip enabled on the first item.
$logos_tooltip = [
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Tooltip Logo', 'hide_logo_title' => 'yes',
      'eael_logo_carousel_tooltip' => 'yes',
      'eael_logo_carousel_tooltip_content' => 'Hover tooltip text',
      'eael_logo_carousel_tooltip_side' => 'top',
      'eael_logo_carousel_tooltip_trigger' => 'hover',
      'eael_logo_carousel_tooltip_animation' => 'fade',
      'eael_pricing_table_toolip_arrow' => 'yes',
      'eael_logo_carousel_tooltip_theme' => 'noir',
      'pricing_item_tooltip_animation_duration' => '300' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Normal Logo', 'hide_logo_title' => 'yes' ],
    [ 'logo_carousel_slide' => [ 'url' => $placeholder ], 'logo_title' => 'Other Logo',  'hide_logo_title' => 'yes' ],
];

$widgets = [

    // ====================================================================
    // Default / Baseline
    // ====================================================================

    ea_heading( '- Default / Baseline -', 'h2' ),

    ea_heading( 'Default Logo Carousel' ),
    ea_widget( 'test-lc-default', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_default,
        ]
    ),

    // ====================================================================
    // Carousel Effects
    // ====================================================================

    ea_heading( '- Carousel Effects -', 'h2' ),

    ea_heading( 'Logo Carousel | Effect: Fade' ),
    ea_widget( 'test-lc-effect-fade', 'eael-logo-carousel',
        [
            'carousel_slides'  => $logos_default,
            'carousel_effect'  => 'fade',
        ]
    ),

    ea_heading( 'Logo Carousel | Effect: Coverflow' ),
    ea_widget( 'test-lc-effect-coverflow', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_default,
            'carousel_effect' => 'coverflow',
        ]
    ),

    ea_heading( 'Logo Carousel | Marquee Mode' ),
    ea_widget( 'test-lc-marquee', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_default,
            'autoplay'        => 'yes',
            'enable_marquee'  => 'yes',
        ]
    ),

    // ====================================================================
    // Navigation Variants
    // ====================================================================

    ea_heading( '- Navigation Variants -', 'h2' ),

    ea_heading( 'Logo Carousel | No Arrows' ),
    ea_widget( 'test-lc-no-arrows', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_default,
            'arrows'          => '',
        ]
    ),

    ea_heading( 'Logo Carousel | No Dots' ),
    ea_widget( 'test-lc-no-dots', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_default,
            'dots'            => '',
        ]
    ),

    // ====================================================================
    // Title & Grayscale
    // ====================================================================

    ea_heading( '- Title & Grayscale -', 'h2' ),

    ea_heading( 'Logo Carousel | Titles Visible' ),
    ea_widget( 'test-lc-title-visible', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_titled,
        ]
    ),

    ea_heading( 'Logo Carousel | Grayscale Normal' ),
    ea_widget( 'test-lc-grayscale', 'eael-logo-carousel',
        [
            'carousel_slides'  => $logos_default,
            'grayscale_normal' => 'yes',
        ]
    ),

    // ====================================================================
    // Link Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Logo Carousel | External Link (target=_blank)' ),
    ea_widget( 'test-lc-link-external', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_linked_external,
        ]
    ),

    ea_heading( 'Logo Carousel | Nofollow Link' ),
    ea_widget( 'test-lc-link-nofollow', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_linked_nofollow,
        ]
    ),

    // ====================================================================
    // Tooltip
    // ====================================================================

    ea_heading( '- Tooltip -', 'h2' ),

    ea_heading( 'Logo Carousel | Tooltip Enabled' ),
    ea_widget( 'test-lc-tooltip', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_tooltip,
        ]
    ),

    // ====================================================================
    // Direction & Autoplay
    // ====================================================================

    ea_heading( '- Direction & Autoplay -', 'h2' ),

    ea_heading( 'Logo Carousel | Direction: Right (RTL)' ),
    ea_widget( 'test-lc-direction-rtl', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_default,
            'direction'       => 'right',
        ]
    ),

    ea_heading( 'Logo Carousel | Autoplay Off' ),
    ea_widget( 'test-lc-autoplay-off', 'eael-logo-carousel',
        [
            'carousel_slides' => $logos_default,
            'autoplay'        => '',
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

WP_CLI::success( 'Logo Carousel page ready → /' . $slug . '/' );
