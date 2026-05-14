<?php
/**
 * Test page: Flip Carousel
 * Run via: wp eval-file /scripts/setup-flip-carousel-page.php
 *
 * Note: Pro-only widget (ea-plugins/essential-addons-elementor).
 * DOM: .eael-flip-carousel[data-style] > ul.flip-items.eael-flip-container > li.eael-flip-item
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

// - Flip Carousel page ---------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Flip Carousel page ---' );

$slug    = getenv( 'FLIP_CAROUSEL_PAGE_SLUG' ) ?: 'flip-carousel';
$page_id = ea_upsert_page( $slug, 'Flip Carousel' );

// Use EA Pro's bundled default slide image (same URL the widget uses for its own defaults).
$slide_img_url = EAEL_PRO_PLUGIN_URL . 'assets/front-end/img/slide.png';

// Helper closure: create one repeater slide item.
$mk = function (
    string $text        = '',
    string $content     = '',
    bool   $link        = false,
    string $link_url    = '#',
    bool   $external    = false,
    bool   $nofollow    = false
) use ( $slide_img_url ): array {
    return [
        'eael_flip_carousel_slide'             => [ 'url' => $slide_img_url, 'id' => 0 ],
        'eael_flip_carousel_slide_text'        => $text,
        'eael_flip_carousel_content'           => $content ?: 'Slide content.',
        'eael_flip_carousel_enable_slide_link' => $link ? 'true' : 'false',
        'eael_flip_carousel_slide_link'        => [
            'url'               => $link_url,
            'is_external'       => $external ? 'on' : '',
            'nofollow'          => $nofollow ? 'on' : '',
            'custom_attributes' => '',
        ],
    ];
};

// Slide sets reused across widget instances.
$text_slides = [
    $mk( 'Slide Alpha' ),
    $mk( 'Slide Beta' ),
    $mk( 'Slide Gamma' ),
    $mk( 'Slide Delta' ),
];

$content_slides = [
    $mk( 'Alpha', '<p>Content for Alpha</p>' ),
    $mk( 'Beta',  '<p>Content for Beta</p>' ),
    $mk( 'Gamma', '<p>Content for Gamma</p>' ),
    $mk( 'Delta', '<p>Content for Delta</p>' ),
];

$ext_link_slides = array_fill( 0, 4, $mk( '', '', true, 'https://essential-addons.com/', true, false ) );
$nofollow_slides = array_fill( 0, 4, $mk( '', '', true, '#', false, true ) );

$widgets = [

    // ====================================================================
    // Carousel Types
    // ====================================================================

    ea_heading( '- Carousel Types -', 'h2' ),

    ea_heading( 'Flip Carousel | Type: Cover-Flow (default)' ),
    ea_widget( 'test-fc-coverflow', 'eael-flip-carousel', [
        'eael_flip_carousel_slides' => $text_slides,
    ] ),

    ea_heading( 'Flip Carousel | Type: Carousel' ),
    ea_widget( 'test-fc-carousel', 'eael-flip-carousel', [
        'eael_flip_carousel_type'   => 'carousel',
        'eael_flip_carousel_slides' => $text_slides,
    ] ),

    ea_heading( 'Flip Carousel | Type: Flat' ),
    ea_widget( 'test-fc-flat', 'eael-flip-carousel', [
        'eael_flip_carousel_type'   => 'flat',
        'eael_flip_carousel_slides' => $text_slides,
    ] ),

    ea_heading( 'Flip Carousel | Type: Wheel' ),
    ea_widget( 'test-fc-wheel', 'eael-flip-carousel', [
        'eael_flip_carousel_type'   => 'wheel',
        'eael_flip_carousel_slides' => $text_slides,
    ] ),

    // ====================================================================
    // Content View
    // ====================================================================

    ea_heading( '- Content View -', 'h2' ),

    ea_heading( 'Flip Carousel | Content View: Hover' ),
    ea_widget( 'test-fc-content-hover', 'eael-flip-carousel', [
        'eael_flip_carousel_content_view' => 'hover',
        'eael_flip_carousel_slides'       => $content_slides,
    ] ),

    ea_heading( 'Flip Carousel | Content View: Always Show' ),
    ea_widget( 'test-fc-content-always', 'eael-flip-carousel', [
        'eael_flip_carousel_content_view' => 'always',
        'eael_flip_carousel_slides'       => $content_slides,
    ] ),

    // ====================================================================
    // Slide Links
    // ====================================================================

    ea_heading( '- Slide Links -', 'h2' ),

    ea_heading( 'Flip Carousel | Slide Link: External (target=_blank)' ),
    ea_widget( 'test-fc-link-ext', 'eael-flip-carousel', [
        'eael_flip_carousel_slides' => $ext_link_slides,
    ] ),

    ea_heading( 'Flip Carousel | Slide Link: Nofollow' ),
    ea_widget( 'test-fc-link-nofollow', 'eael-flip-carousel', [
        'eael_flip_carousel_slides' => $nofollow_slides,
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

WP_CLI::success( 'Flip Carousel page ready → /flip-carousel/' );
