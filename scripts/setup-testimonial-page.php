<?php
/**
 * Test page: Testimonial
 * Run via: wp eval-file /scripts/setup-testimonial-page.php
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

// - Testimonial page ----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Testimonial page ---' );

$slug    = getenv( 'TESTIMONIAL_PAGE_SLUG' ) ?: 'testimonial';
$page_id = ea_upsert_page( $slug, 'Testimonial' );

$widgets = [

    // ====================================================================
    // Styles / Presets (free — 8 skins)
    // ====================================================================

    ea_heading( '- Styles / Presets -', 'h2' ),

    ea_heading( 'Default Testimonial' ),
    ea_widget( 'test-t-default', 'eael-testimonial', [
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is a default style testimonial.',
    ] ),

    ea_heading( 'Testimonial | Style: Classic' ),
    ea_widget( 'test-t-classic', 'eael-testimonial', [
        'eael_testimonial_style'         => 'classic-style',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is a classic style testimonial.',
    ] ),

    ea_heading( 'Testimonial | Style: Middle' ),
    ea_widget( 'test-t-middle', 'eael-testimonial', [
        'eael_testimonial_style'         => 'middle-style',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is a middle style testimonial.',
    ] ),

    ea_heading( 'Testimonial | Style: Icon/Image Left Content' ),
    ea_widget( 'test-t-icon-left', 'eael-testimonial', [
        'eael_testimonial_style'         => 'icon-img-left-content',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is an icon-image-left style testimonial.',
    ] ),

    ea_heading( 'Testimonial | Style: Content Icon/Image Right' ),
    ea_widget( 'test-t-icon-right', 'eael-testimonial', [
        'eael_testimonial_style'         => 'icon-img-right-content',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is an icon-image-right style testimonial.',
    ] ),

    ea_heading( 'Testimonial | Style: Content Top Icon Title Inline' ),
    ea_widget( 'test-t-top-inline', 'eael-testimonial', [
        'eael_testimonial_style'         => 'content-top-icon-title-inline',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is a content-top inline style testimonial.',
    ] ),

    ea_heading( 'Testimonial | Style: Content Bottom Icon Title Inline' ),
    ea_widget( 'test-t-bottom-inline', 'eael-testimonial', [
        'eael_testimonial_style'         => 'content-bottom-icon-title-inline',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is a content-bottom inline style testimonial.',
    ] ),

    ea_heading( 'Testimonial | Style: Simple Layout' ),
    ea_widget( 'test-t-simple', 'eael-testimonial', [
        'eael_testimonial_style'         => 'simple-layout',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'This is a simple layout testimonial.',
    ] ),

    // ====================================================================
    // Content Toggles
    // ====================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'Testimonial | No Avatar' ),
    ea_widget( 'test-t-no-avatar', 'eael-testimonial', [
        'eael_testimonial_enable_avatar' => '',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'Testimonial without avatar.',
    ] ),

    ea_heading( 'Testimonial | No Quote Icon' ),
    ea_widget( 'test-t-no-quote', 'eael-testimonial', [
        'eael_testimonial_show_quote'    => '',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'Testimonial without quote icon.',
    ] ),

    ea_heading( 'Testimonial | No Rating' ),
    ea_widget( 'test-t-no-rating', 'eael-testimonial', [
        'eael_testimonial_enable_rating' => '',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'Testimonial without star rating.',
    ] ),

    // ====================================================================
    // Rating Variants
    // ====================================================================

    ea_heading( '- Rating Variants -', 'h2' ),

    ea_heading( 'Testimonial | Rating: 1 Star' ),
    ea_widget( 'test-t-rating-one', 'eael-testimonial', [
        'eael_testimonial_rating_number' => 'rating-one',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'Testimonial with 1-star rating.',
    ] ),

    ea_heading( 'Testimonial | Rating Position: Top' ),
    ea_widget( 'test-t-rating-top', 'eael-testimonial', [
        'eael_testimonial_rating_position' => 'top',
        'eael_testimonial_name'            => 'Jane Smith',
        'eael_testimonial_company_title'   => 'Acme Corp',
        'eael_testimonial_description'     => 'Testimonial with rating at the top.',
    ] ),

    // ====================================================================
    // Alignment
    // ====================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'Testimonial | Alignment: Center' ),
    ea_widget( 'test-t-align-center', 'eael-testimonial', [
        'eael_testimonial_alignment'     => 'center',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'Center-aligned testimonial.',
    ] ),

    ea_heading( 'Testimonial | Alignment: Right' ),
    ea_widget( 'test-t-align-right', 'eael-testimonial', [
        'eael_testimonial_alignment'     => 'right',
        'eael_testimonial_name'          => 'Jane Smith',
        'eael_testimonial_company_title' => 'Acme Corp',
        'eael_testimonial_description'   => 'Right-aligned testimonial.',
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

WP_CLI::success( 'Testimonial page ready → /testimonial/' );
