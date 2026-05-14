<?php
/**
 * Test page: Post List
 * Run via: wp eval-file /scripts/setup-post-list-page.php
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

// - Sample posts (required for Post List widget to render items) --------
// setup-sample-posts.php seeds 12 posts with categories, tags, and thumbnails.
// When run standalone (not via setup-test-pages.sh), this require_once ensures
// posts are present before the widget page is created.
require_once '/scripts/setup-sample-posts.php';

// - Post List page -------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Post List page ---' );

$slug    = getenv( 'POST_LIST_PAGE_SLUG' ) ?: 'post-list';
$page_id = ea_upsert_page( $slug, 'Post List' );

$widgets = [

    // ====================================================================
    // Layout Types
    // ====================================================================

    ea_heading( '- Layout Types -', 'h2' ),

    ea_heading( 'Default Post List (Layout: Default)' ),
    ea_widget( 'test-pl-default', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'Recent Posts',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
            'eael_post_list_title_tag'          => 'h2',
        ]
    ),

    ea_heading( 'Post List | Layout: Preset 2' ),
    ea_widget( 'test-pl-preset-2', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'preset-2',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'Recent Posts',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
            'eael_post_list_title_tag'          => 'h2',
        ]
    ),

    ea_heading( 'Post List | Layout: Preset 3' ),
    ea_widget( 'test-pl-preset-3', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'preset-3',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'Recent Posts',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
            'eael_post_list_title_tag'          => 'h2',
        ]
    ),

    ea_heading( 'Post List | Layout: Advanced' ),
    ea_widget( 'test-pl-advanced', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'advanced',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'Recent Posts',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
            'eael_post_list_title_tag'          => 'h2',
        ]
    ),

    // ====================================================================
    // Top Bar & Filter Variants
    // ====================================================================

    ea_heading( '- Top Bar & Filter Variants -', 'h2' ),

    ea_heading( 'Post List | No Top Bar' ),
    ea_widget( 'test-pl-no-topbar', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => '',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
        ]
    ),

    ea_heading( 'Post List | No Category Filter' ),
    ea_widget( 'test-pl-no-filter', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'No Filter',
            'eael_post_list_terms'              => '',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
        ]
    ),

    // ====================================================================
    // Pagination Variants
    // ====================================================================

    ea_heading( '- Pagination Variants -', 'h2' ),

    ea_heading( 'Post List | No Pagination' ),
    ea_widget( 'test-pl-no-pagination', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'No Pagination',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'none',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
        ]
    ),

    ea_heading( 'Post List | Pagination: Page Numbers' ),
    ea_widget( 'test-pl-page-numbers', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '2',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'Page Numbers',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'pagination',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
        ]
    ),

    // ====================================================================
    // Content Toggle Variants
    // ====================================================================

    ea_heading( '- Content Toggle Variants -', 'h2' ),

    ea_heading( 'Post List | No Feature Image' ),
    ea_widget( 'test-pl-no-image', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'No Image',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => '',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => 'yes',
        ]
    ),

    ea_heading( 'Post List | No Post Meta' ),
    ea_widget( 'test-pl-no-meta', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'No Meta',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => '',
            'eael_post_list_post_title'         => 'yes',
        ]
    ),

    ea_heading( 'Post List | With Excerpt & Read More' ),
    ea_widget( 'test-pl-with-excerpt', 'eael-post-list',
        [
            'post_type'                               => 'post',
            'posts_per_page'                          => '4',
            'eael_post_list_layout_type'              => 'default',
            'eael_post_list_topbar'                   => 'yes',
            'eael_post_list_topbar_title'             => 'With Excerpt',
            'eael_post_list_terms'                    => 'yes',
            'eael_post_list_pagination'               => 'navigation',
            'eael_post_list_post_feature_image'       => 'yes',
            'eael_post_list_post_meta'                => 'yes',
            'eael_post_list_post_title'               => 'yes',
            'eael_post_list_post_excerpt'             => 'yes',
            'eael_post_list_post_excerpt_length'      => '12',
            'eael_post_list_excerpt_expanison_indicator' => '...',
            'eael_show_read_more_button'              => 'yes',
            'eael_post_list_read_more_text'           => 'Read More',
        ]
    ),

    ea_heading( 'Post List | No Post Title' ),
    ea_widget( 'test-pl-no-title', 'eael-post-list',
        [
            'post_type'                         => 'post',
            'posts_per_page'                    => '4',
            'eael_post_list_layout_type'        => 'default',
            'eael_post_list_topbar'             => 'yes',
            'eael_post_list_topbar_title'       => 'No Title',
            'eael_post_list_terms'              => 'yes',
            'eael_post_list_pagination'         => 'navigation',
            'eael_post_list_post_feature_image' => 'yes',
            'eael_post_list_post_meta'          => 'yes',
            'eael_post_list_post_title'         => '',
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

WP_CLI::success( 'Post List page ready → /' . $slug . '/' );
