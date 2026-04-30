<?php
/**
 * Test page: Dynamic Filterable Gallery
 * Run via: wp eval-file /scripts/setup-dynamic-filterable-gallery-page.php
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

// ── Dynamic Filterable Gallery page ───────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Dynamic Filterable Gallery page ---' );

$slug    = getenv( 'DYNAMIC_FILTERABLE_GALLERY_PAGE_SLUG' ) ?: 'dynamic-filterable-gallery';
$page_id = ea_upsert_page( $slug, 'Dynamic Filterable Gallery' );

// Base settings shared by all instances.
// The query controls (via eael/controls/query action) have these defaults:
//   post_type => 'post', posts_per_page => 3, orderby => 'date', order => 'desc'
$base = [
    'post_type'               => 'post',
    'posts_per_page'          => '6',
    'orderby'                 => 'date',
    'order'                   => 'desc',
    'eael_fg_grid_style'      => 'hoverer',
    'eael_fg_gallery_layout_mode' => 'grid',
    'eael_fg_columns'         => '3',
    'show_gallery_filter_controls' => '1',
    'eael_fg_filter_position' => 'top',
    'eael_fg_all_label_text'  => 'All',
    'eael_show_hover_title'   => 'yes',
    'eael_show_hover_excerpt' => 'yes',
    'eael_post_excerpt'       => '12',
    'eael_post_excerpt_read_more' => 'Read More',
    'eael_fg_show_popup'      => 'true',
    'eael_fg_show_popup_styles' => 'buttons',
    'eael_fg_grid_hover_style'  => 'eael-fade-in',
    'eael_fg_filter_duration' => 500,
    'eael_section_fg_zoom_icon_new' => [ 'value' => 'fas fa-search-plus', 'library' => 'fa-solid' ],
    'eael_section_fg_link_icon_new' => [ 'value' => 'fas fa-link', 'library' => 'fa-solid' ],
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Style Presets
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Style Presets ──', 'h2' ),

    ea_heading( 'Default Dynamic Gallery (Hoverer)' ),
    ea_widget( 'test-dfg-default', 'eael-dynamic-filterable-gallery', $base ),

    ea_heading( 'Dynamic Gallery | Style: Cards' ),
    ea_widget( 'test-dfg-cards', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_fg_grid_style' => 'cards',
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Layout Modes
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layout Modes ──', 'h2' ),

    ea_heading( 'Dynamic Gallery | Layout: Masonry' ),
    ea_widget( 'test-dfg-masonry', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_fg_gallery_layout_mode' => 'masonry',
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Filter Controls
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Filter Controls ──', 'h2' ),

    ea_heading( 'Dynamic Gallery | No Filter Controls' ),
    ea_widget( 'test-dfg-no-filter', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'show_gallery_filter_controls' => '0',
        ] )
    ),

    ea_heading( 'Dynamic Gallery | Filter Position: Left' ),
    ea_widget( 'test-dfg-filter-left', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_fg_filter_position' => 'left',
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Toggles ──', 'h2' ),

    ea_heading( 'Dynamic Gallery | Title Hidden' ),
    ea_widget( 'test-dfg-no-title', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_show_hover_title' => '',
        ] )
    ),

    ea_heading( 'Dynamic Gallery | Excerpt Hidden' ),
    ea_widget( 'test-dfg-no-excerpt', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_show_hover_excerpt' => '',
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Hover Styles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Hover Styles ──', 'h2' ),

    ea_heading( 'Dynamic Gallery | Hover: Slide Up' ),
    ea_widget( 'test-dfg-hover-slide', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_fg_grid_hover_style' => 'eael-slide-up',
        ] )
    ),

    ea_heading( 'Dynamic Gallery | Hover: Zoom In' ),
    ea_widget( 'test-dfg-hover-zoom', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_fg_grid_hover_style' => 'eael-zoom-in',
        ] )
    ),

    ea_heading( 'Dynamic Gallery | Hover: None' ),
    ea_widget( 'test-dfg-hover-none', 'eael-dynamic-filterable-gallery',
        array_merge( $base, [
            'eael_fg_grid_hover_style' => 'eael-none',
        ] )
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

WP_CLI::success( 'Dynamic Filterable Gallery page ready → /dynamic-filterable-gallery/' );
