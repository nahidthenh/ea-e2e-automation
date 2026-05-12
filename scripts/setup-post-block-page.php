<?php
/**
 * Test page: Post Block
 * Run via: wp eval-file /scripts/setup-post-block-page.php
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

// - Post Block page ----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Post Block page ---' );

$slug    = getenv( 'POST_BLOCK_PAGE_SLUG' ) ?: 'post-block';
$page_id = ea_upsert_page( $slug, 'Post Block' );

$widgets = [

    // ====================================================================
    // Skins
    // ====================================================================

    ea_heading( '- Skins -', 'h2' ),

    ea_heading( 'Post Block | Skin: Default' ),
    ea_widget( 'test-pb-default', 'eael-post-block',
        [
            'grid_style'                 => 'post-block-style-default',
            'eael_post_block_layout'     => 'post-block-layout-block',
            'eael_show_title'            => 'yes',
            'eael_show_excerpt'          => 'yes',
            'eael_show_read_more_button' => 'yes',
            'eael_show_meta'             => 'yes',
            'eael_show_image'            => 'yes',
            'eael_show_avatar'           => 'yes',
            'eael_show_author'           => 'yes',
            'eael_show_date'             => 'yes',
            'meta_position'              => 'meta-entry-footer',
            'posts_per_page'             => 3,
        ]
    ),

    ea_heading( 'Post Block | Skin: Overlay' ),
    ea_widget( 'test-pb-overlay', 'eael-post-block',
        [
            'grid_style'                 => 'post-block-style-overlay',
            'eael_post_block_layout'     => 'post-block-layout-block',
            'eael_show_title'            => 'yes',
            'eael_show_excerpt'          => 'yes',
            'eael_show_read_more_button' => 'yes',
            'eael_show_meta'             => 'yes',
            'eael_show_image'            => 'yes',
            'eael_show_author'           => 'yes',
            'eael_show_date'             => 'yes',
            'posts_per_page'             => 3,
        ]
    ),

    // ====================================================================
    // Layout Modes
    // ====================================================================

    ea_heading( '- Layout Modes -', 'h2' ),

    ea_heading( 'Post Block | Layout: Block (default)' ),
    ea_widget( 'test-pb-layout-block', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_post_block_layout' => 'post-block-layout-block',
            'eael_show_title'        => 'yes',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 3,
        ]
    ),

    ea_heading( 'Post Block | Layout: Tiled — Preset 1' ),
    ea_widget( 'test-pb-tiled', 'eael-post-block',
        [
            'grid_style'              => 'post-block-style-default',
            'eael_post_block_layout'  => 'post-block-layout-tiled',
            'eael_post_tiled_preset'  => 'eael-post-tiled-preset-1',
            'eael_post_tiled_column'  => 'eael-post-tiled-col-4',
            'eael_show_title'         => 'yes',
            'eael_show_image'         => 'yes',
            'posts_per_page'          => 5,
        ]
    ),

    ea_heading( 'Post Block | Layout: Tiled — Preset 2' ),
    ea_widget( 'test-pb-tiled-preset-2', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_post_block_layout' => 'post-block-layout-tiled',
            'eael_post_tiled_preset' => 'eael-post-tiled-preset-2',
            'eael_post_tiled_column' => 'eael-post-tiled-col-4',
            'eael_show_title'        => 'yes',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 4,
        ]
    ),

    ea_heading( 'Post Block | Layout: Tiled — Preset 3' ),
    ea_widget( 'test-pb-tiled-preset-3', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_post_block_layout' => 'post-block-layout-tiled',
            'eael_post_tiled_preset' => 'eael-post-tiled-preset-3',
            'eael_post_tiled_column' => 'eael-post-tiled-col-3',
            'eael_show_title'        => 'yes',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 5,
        ]
    ),

    // ====================================================================
    // Content Toggles
    // ====================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'Post Block | No Title' ),
    ea_widget( 'test-pb-no-title', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => '',
            'eael_show_excerpt'      => 'yes',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 3,
        ]
    ),

    ea_heading( 'Post Block | No Excerpt' ),
    ea_widget( 'test-pb-no-excerpt', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => 'yes',
            'eael_show_excerpt'      => '',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 3,
        ]
    ),

    ea_heading( 'Post Block | No Read More Button' ),
    ea_widget( 'test-pb-no-readmore', 'eael-post-block',
        [
            'grid_style'                 => 'post-block-style-default',
            'eael_show_title'            => 'yes',
            'eael_show_excerpt'          => 'yes',
            'eael_show_read_more_button' => '',
            'eael_show_image'            => 'yes',
            'posts_per_page'             => 3,
        ]
    ),

    ea_heading( 'Post Block | No Image' ),
    ea_widget( 'test-pb-no-image', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => 'yes',
            'eael_show_excerpt'      => 'yes',
            'eael_show_image'        => '',
            'posts_per_page'         => 3,
        ]
    ),

    ea_heading( 'Post Block | No Meta' ),
    ea_widget( 'test-pb-no-meta', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => 'yes',
            'eael_show_meta'         => '',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 3,
        ]
    ),

    // ====================================================================
    // Meta Position
    // ====================================================================

    ea_heading( '- Meta Position -', 'h2' ),

    ea_heading( 'Post Block | Meta: Entry Footer (default)' ),
    ea_widget( 'test-pb-meta-footer', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => 'yes',
            'eael_show_meta'         => 'yes',
            'eael_show_avatar'       => 'yes',
            'eael_show_author'       => 'yes',
            'eael_show_date'         => 'yes',
            'meta_position'          => 'meta-entry-footer',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 3,
        ]
    ),

    ea_heading( 'Post Block | Meta: Entry Header' ),
    ea_widget( 'test-pb-meta-header', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => 'yes',
            'eael_show_meta'         => 'yes',
            'eael_show_author'       => 'yes',
            'eael_show_date'         => 'yes',
            'meta_position'          => 'meta-entry-header',
            'eael_show_image'        => 'yes',
            'posts_per_page'         => 3,
        ]
    ),

    // ====================================================================
    // Title Tag
    // ====================================================================

    ea_heading( '- Title Tag -', 'h2' ),

    ea_heading( 'Post Block | Title Tag: h2 (default)' ),
    ea_widget( 'test-pb-title-h2', 'eael-post-block',
        [
            'grid_style'      => 'post-block-style-default',
            'eael_show_title' => 'yes',
            'title_tag'       => 'h2',
            'eael_show_image' => 'yes',
            'posts_per_page'  => 3,
        ]
    ),

    ea_heading( 'Post Block | Title Tag: h3' ),
    ea_widget( 'test-pb-title-h3', 'eael-post-block',
        [
            'grid_style'      => 'post-block-style-default',
            'eael_show_title' => 'yes',
            'title_tag'       => 'h3',
            'eael_show_image' => 'yes',
            'posts_per_page'  => 3,
        ]
    ),

    // ====================================================================
    // Load More
    // ====================================================================

    ea_heading( '- Load More -', 'h2' ),

    ea_heading( 'Post Block | Load More: Button' ),
    ea_widget( 'test-pb-load-more', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => 'yes',
            'eael_show_image'        => 'yes',
            'show_load_more'         => 'yes',
            'show_load_more_text'    => 'Load More',
            'posts_per_page'         => 2,
        ]
    ),

    // ====================================================================
    // Link Settings
    // ====================================================================

    ea_heading( '- Link Settings -', 'h2' ),

    ea_heading( 'Post Block | Image Link: target=_blank' ),
    ea_widget( 'test-pb-img-target-blank', 'eael-post-block',
        [
            'grid_style'              => 'post-block-style-default',
            'eael_show_title'         => 'yes',
            'eael_show_image'         => 'yes',
            'image_link_target_blank' => 'true',
            'posts_per_page'          => 3,
        ]
    ),

    ea_heading( 'Post Block | Image Link: nofollow' ),
    ea_widget( 'test-pb-img-nofollow', 'eael-post-block',
        [
            'grid_style'           => 'post-block-style-default',
            'eael_show_title'      => 'yes',
            'eael_show_image'      => 'yes',
            'image_link_nofollow'  => 'true',
            'posts_per_page'       => 3,
        ]
    ),

    ea_heading( 'Post Block | Title Link: target=_blank' ),
    ea_widget( 'test-pb-title-target-blank', 'eael-post-block',
        [
            'grid_style'              => 'post-block-style-default',
            'eael_show_title'         => 'yes',
            'eael_show_image'         => 'yes',
            'title_link_target_blank' => 'true',
            'posts_per_page'          => 3,
        ]
    ),

    ea_heading( 'Post Block | Read More Link: nofollow' ),
    ea_widget( 'test-pb-readmore-nofollow', 'eael-post-block',
        [
            'grid_style'                 => 'post-block-style-default',
            'eael_show_title'            => 'yes',
            'eael_show_excerpt'          => 'yes',
            'eael_show_read_more_button' => 'yes',
            'eael_show_image'            => 'yes',
            'read_more_link_nofollow'    => 'true',
            'posts_per_page'             => 3,
        ]
    ),

    // ====================================================================
    // Post Terms
    // ====================================================================

    ea_heading( '- Post Terms -', 'h2' ),

    ea_heading( 'Post Block | Post Terms: Category' ),
    ea_widget( 'test-pb-terms', 'eael-post-block',
        [
            'grid_style'             => 'post-block-style-default',
            'eael_show_title'        => 'yes',
            'eael_show_image'        => 'yes',
            'eael_show_post_terms'   => 'yes',
            'eael_post_terms'        => 'category',
            'posts_per_page'         => 3,
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

WP_CLI::success( 'Post Block page ready → /post-block/' );
