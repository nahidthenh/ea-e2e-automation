<?php
/**
 * Test page: Post Timeline
 * Run via: wp eval-file /scripts/setup-post-timeline-page.php
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

// ── Post Timeline page ─────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Post Timeline page ---' );

$slug    = getenv( 'POST_TIMELINE_PAGE_SLUG' ) ?: 'post-timeline';
$page_id = ea_upsert_page( $slug, 'Post Timeline' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Layouts / Templates
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layouts ──', 'h2' ),

    ea_heading( 'Default Post Timeline' ),
    ea_widget( 'test-pt-default', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'default',
            'eael_show_image'              => 'yes',
            'eael_show_title'              => 'yes',
            'eael_show_excerpt'            => 'yes',
            'eael_excerpt_length'          => 10,
            'excerpt_expanison_indicator'  => '...',
            'posts_per_page'               => 5,
        ]
    ),

    ea_heading( 'Post Timeline | Layout: Card' ),
    ea_widget( 'test-pt-layout-card', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'card',
            'eael_show_image'              => 'yes',
            'eael_show_title'              => 'yes',
            'eael_show_excerpt'            => 'yes',
            'eael_excerpt_length'          => 10,
            'excerpt_expanison_indicator'  => '...',
            'posts_per_page'               => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Link Settings
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Link Settings ──', 'h2' ),

    ea_heading( 'Post Timeline | Link: nofollow' ),
    ea_widget( 'test-pt-nofollow', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'default',
            'timeline_link_nofollow'       => 'true',
            'eael_show_image'              => 'yes',
            'eael_show_title'              => 'yes',
            'posts_per_page'               => 5,
        ]
    ),

    ea_heading( 'Post Timeline | Link: target=_blank' ),
    ea_widget( 'test-pt-target-blank', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'default',
            'timeline_link_target_blank'   => 'true',
            'eael_show_image'              => 'yes',
            'eael_show_title'              => 'yes',
            'posts_per_page'               => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Toggles ──', 'h2' ),

    ea_heading( 'Post Timeline | No Title' ),
    ea_widget( 'test-pt-no-title', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'default',
            'eael_show_image'              => 'yes',
            'eael_show_title'              => '',
            'eael_show_excerpt'            => 'yes',
            'posts_per_page'               => 5,
        ]
    ),

    ea_heading( 'Post Timeline | No Excerpt' ),
    ea_widget( 'test-pt-no-excerpt', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'default',
            'eael_show_image'              => 'yes',
            'eael_show_title'              => 'yes',
            'eael_show_excerpt'            => '',
            'posts_per_page'               => 5,
        ]
    ),

    ea_heading( 'Post Timeline | No Image' ),
    ea_widget( 'test-pt-no-image', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'default',
            'eael_show_image'              => '',
            'eael_show_title'              => 'yes',
            'eael_show_excerpt'            => 'yes',
            'posts_per_page'               => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Title Tag
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Title Tag ──', 'h2' ),

    ea_heading( 'Post Timeline | Title Tag: h3' ),
    ea_widget( 'test-pt-title-h3', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout' => 'default',
            'eael_show_title'              => 'yes',
            'title_tag'                    => 'h3',
            'eael_show_image'              => 'yes',
            'posts_per_page'               => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Arrow Alignment (card layout only)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Arrow Alignment ──', 'h2' ),

    ea_heading( 'Post Timeline | Card | Arrow: Middle' ),
    ea_widget( 'test-pt-arrow-middle', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout'    => 'card',
            'eael_timeline_arrow_alignment'   => 'middle',
            'eael_show_image'                 => 'yes',
            'eael_show_title'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Timeline | Card | Arrow: Bottom' ),
    ea_widget( 'test-pt-arrow-bottom', 'eael-post-timeline',
        [
            'eael_dynamic_template_Layout'    => 'card',
            'eael_timeline_arrow_alignment'   => 'bottom',
            'eael_show_image'                 => 'yes',
            'eael_show_title'                 => 'yes',
            'posts_per_page'                  => 5,
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

WP_CLI::success( 'Post Timeline page ready → /post-timeline/' );
