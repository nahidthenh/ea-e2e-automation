<?php
/**
 * Test page: Post Grid
 * Run via: wp eval-file /scripts/setup-post-grid-page.php
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

// - Post Grid page -----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Post Grid page ---' );

$slug    = getenv( 'POST_GRID_PAGE_SLUG' ) ?: 'post-grid';
$page_id = ea_upsert_page( $slug, 'Post Grid' );

$widgets = [

    // ====================================================================
    // Skins / Presets
    // ====================================================================

    ea_heading( '- Skins / Presets -', 'h2' ),

    ea_heading( 'Post Grid | Skin: One (Default)' ),
    ea_widget( 'test-pg-default', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'layout_mode'                 => 'masonry',
            'eael_show_title'             => 'yes',
            'eael_show_excerpt'           => 'yes',
            'eael_show_read_more_button'  => 'yes',
            'eael_show_meta'              => 'yes',
            'eael_show_image'             => 'yes',
            'eael_show_date'              => 'yes',
        ]
    ),

    ea_heading( 'Post Grid | Skin: Two' ),
    ea_widget( 'test-pg-skin-two', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'two',
            'layout_mode'                 => 'masonry',
            'eael_show_title'             => 'yes',
            'eael_show_excerpt'           => 'yes',
            'eael_show_read_more_button'  => 'yes',
            'eael_show_meta'              => 'yes',
            'eael_show_image'             => 'yes',
            'eael_show_date'              => 'yes',
        ]
    ),

    ea_heading( 'Post Grid | Skin: Three' ),
    ea_widget( 'test-pg-skin-three', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'three',
            'layout_mode'                 => 'masonry',
            'eael_show_title'             => 'yes',
            'eael_show_excerpt'           => 'yes',
            'eael_show_read_more_button'  => 'yes',
            'eael_show_meta'              => 'yes',
            'eael_show_image'             => 'yes',
            'eael_show_date'              => 'yes',
        ]
    ),

    // ====================================================================
    // Layout Modes
    // ====================================================================

    ea_heading( '- Layout Modes -', 'h2' ),

    ea_heading( 'Post Grid | Layout: Grid' ),
    ea_widget( 'test-pg-grid', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'layout_mode'                 => 'grid',
        ]
    ),

    ea_heading( 'Post Grid | Layout: Masonry' ),
    ea_widget( 'test-pg-masonry', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'layout_mode'                 => 'masonry',
        ]
    ),

    // ====================================================================
    // Content Toggles
    // ====================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'Post Grid | No Title' ),
    ea_widget( 'test-pg-no-title', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'eael_show_title'             => '',
        ]
    ),

    ea_heading( 'Post Grid | No Excerpt' ),
    ea_widget( 'test-pg-no-excerpt', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'eael_show_excerpt'           => '',
        ]
    ),

    ea_heading( 'Post Grid | No Read More' ),
    ea_widget( 'test-pg-no-readmore', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'eael_show_read_more_button'  => '',
        ]
    ),

    ea_heading( 'Post Grid | No Meta' ),
    ea_widget( 'test-pg-no-meta', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'eael_show_meta'              => '',
        ]
    ),

    ea_heading( 'Post Grid | No Image' ),
    ea_widget( 'test-pg-no-image', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'eael_show_image'             => '',
        ]
    ),

    // ====================================================================
    // Load More
    // ====================================================================

    ea_heading( '- Load More -', 'h2' ),

    ea_heading( 'Post Grid | Load More Button' ),
    ea_widget( 'test-pg-load-more', 'eael-post-grid',
        [
            'eael_post_grid_preset_style' => 'one',
            'show_load_more'              => 'yes',
            'show_load_more_text'         => 'Load More',
            'posts_per_page'              => 2,
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

WP_CLI::success( 'Post Grid page ready → /post-grid/' );
