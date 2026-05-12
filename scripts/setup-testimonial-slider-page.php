<?php
/**
 * Test page: Testimonial Slider
 * Run via: wp eval-file /scripts/setup-testimonial-slider-page.php
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

// - Testimonial Slider page ------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Testimonial Slider page ---' );

$slug    = getenv( 'TESTIMONIAL_SLIDER_PAGE_SLUG' ) ?: 'testimonial-slider';
$page_id = ea_upsert_page( $slug, 'Testimonial Slider' );

// Default repeater items with distinct, verifiable names and text.
$default_items = [
    [
        'eael_testimonial_enable_avatar'  => 'yes',
        'eael_testimonial_name'           => 'Alice Anderson',
        'eael_testimonial_company_title'  => 'TechCorp',
        'eael_testimonial_description'    => 'This product transformed our workflow completely.',
        'eael_testimonial_enable_rating'  => 'yes',
        'eael_testimonial_rating_number'  => 'rating-five',
    ],
    [
        'eael_testimonial_enable_avatar'  => 'yes',
        'eael_testimonial_name'           => 'Bob Brown',
        'eael_testimonial_company_title'  => 'DesignHub',
        'eael_testimonial_description'    => 'Exceptional quality and outstanding support team.',
        'eael_testimonial_enable_rating'  => 'yes',
        'eael_testimonial_rating_number'  => 'rating-four',
    ],
    [
        'eael_testimonial_enable_avatar'  => 'yes',
        'eael_testimonial_name'           => 'Carol Clark',
        'eael_testimonial_company_title'  => 'MarketPro',
        'eael_testimonial_description'    => 'I highly recommend this to every professional.',
        'eael_testimonial_enable_rating'  => 'yes',
        'eael_testimonial_rating_number'  => 'rating-three',
    ],
];

$no_avatar_items = array_map( function( $item ) {
    $item['eael_testimonial_enable_avatar'] = '';
    return $item;
}, $default_items );

$widgets = [

    // ====================================================================
    // Skins / Presets
    // ====================================================================

    ea_heading( '- Skins / Presets -', 'h2' ),

    ea_heading( 'Default Testimonial Slider' ),
    ea_widget( 'test-ts-default', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'default-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Style: Classic' ),
    ea_widget( 'test-ts-classic', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'classic-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Style: Simple Layout' ),
    ea_widget( 'test-ts-simple', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'simple-layout',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Style: Content | Icon/Image (icon-img-right-content)' ),
    ea_widget( 'test-ts-icon-right', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'icon-img-right-content',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Style: Content | Icon/Image | Bio (middle-style)' ),
    ea_widget( 'test-ts-middle', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'middle-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Style: Content Top | Icon Title Inline' ),
    ea_widget( 'test-ts-content-top-inline', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'content-top-icon-title-inline',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Style: Icon/Image | Content (icon-img-left-content)' ),
    ea_widget( 'test-ts-icon-left', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'icon-img-left-content',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Style: Content Bottom | Icon Title Inline' ),
    ea_widget( 'test-ts-content-bottom-inline', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'content-bottom-icon-title-inline',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    // ====================================================================
    // Quote Icon Variants
    // ====================================================================

    ea_heading( '- Quote Icon Variants -', 'h2' ),

    ea_heading( 'Testimonial Slider | No Quote Icon' ),
    ea_widget( 'test-ts-no-quote', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'classic-style',
            'eael_testimonial_show_quote'    => '',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    // ====================================================================
    // Navigation Variants
    // ====================================================================

    ea_heading( '- Navigation Variants -', 'h2' ),

    ea_heading( 'Testimonial Slider | No Arrows' ),
    ea_widget( 'test-ts-no-arrows', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'default-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => '',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Testimonial Slider | No Dots' ),
    ea_widget( 'test-ts-no-dots', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'default-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => '',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    // ====================================================================
    // Alignment Variants
    // ====================================================================

    ea_heading( '- Alignment Variants -', 'h2' ),

    ea_heading( 'Testimonial Slider | Align Center' ),
    ea_widget( 'test-ts-align-center', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'default-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_alignment'     => 'eael-testimonial-align-center',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    ea_heading( 'Testimonial Slider | Align Right' ),
    ea_widget( 'test-ts-align-right', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'default-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_alignment'     => 'eael-testimonial-align-right',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    // ====================================================================
    // Avatar & Content
    // ====================================================================

    ea_heading( '- Avatar & Content -', 'h2' ),

    ea_heading( 'Testimonial Slider | No Avatar' ),
    ea_widget( 'test-ts-no-avatar', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'default-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $no_avatar_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'slide',
        ]
    ),

    // ====================================================================
    // Carousel Effects
    // ====================================================================

    ea_heading( '- Carousel Effects -', 'h2' ),

    ea_heading( 'Testimonial Slider | Effect: Fade' ),
    ea_widget( 'test-ts-effect-fade', 'eael-testimonial-slider',
        [
            'eael_testimonial_style'         => 'default-style',
            'eael_testimonial_show_quote'    => 'yes',
            'eael_testimonial_slider_item'   => $default_items,
            'arrows'                         => 'yes',
            'dots'                           => 'yes',
            'autoplay'                       => 'yes',
            'infinite_loop'                  => 'yes',
            'carousel_effect'                => 'fade',
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

WP_CLI::success( 'Testimonial Slider page ready → /' . $slug . '/' );
