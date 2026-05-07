<?php
/**
 * Test page: Post Carousel
 * Run via: wp eval-file /scripts/setup-post-carousel-page.php
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

// ── Post Carousel page ─────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Post Carousel page ---' );

$slug    = getenv( 'POST_CAROUSEL_PAGE_SLUG' ) ?: 'post-carousel';
$page_id = ea_upsert_page( $slug, 'Post Carousel' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Skins (preset_style: one / two / three)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Skins ──', 'h2' ),

    ea_heading( 'Default Post Carousel | Skin: One' ),
    ea_widget( 'test-pc-default', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_post_carousel_item_style'   => 'eael-cards',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_read_more_button'      => 'yes',
            'eael_show_meta'                  => 'yes',
            'eael_show_image'                 => 'yes',
            'eael_show_avatar'                => 'yes',
            'eael_show_author'                => 'yes',
            'eael_show_date'                  => 'yes',
            'meta_position'                   => 'meta-entry-footer',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Skin: Two' ),
    ea_widget( 'test-pc-skin-two', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'two',
            'eael_post_carousel_item_style'   => 'eael-cards',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_read_more_button'      => 'yes',
            'eael_show_image'                 => 'yes',
            'eael_show_meta'                  => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Skin: Three' ),
    ea_widget( 'test-pc-skin-three', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'three',
            'eael_post_carousel_item_style'   => 'eael-cards',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_read_more_button'      => 'yes',
            'eael_show_image'                 => 'yes',
            'eael_show_meta'                  => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Carousel effects (data-effect)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Carousel Effects ──', 'h2' ),

    ea_heading( 'Post Carousel | Effect: Slide (default)' ),
    ea_widget( 'test-pc-effect-slide', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'carousel_effect'                 => 'slide',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Effect: Fade' ),
    ea_widget( 'test-pc-effect-fade', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'carousel_effect'                 => 'fade',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Effect: Coverflow' ),
    ea_widget( 'test-pc-effect-coverflow', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'carousel_effect'                 => 'coverflow',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Effect: Cube' ),
    ea_widget( 'test-pc-effect-cube', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'carousel_effect'                 => 'cube',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Effect: Flip' ),
    ea_widget( 'test-pc-effect-flip', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'carousel_effect'                 => 'flip',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Item Style (Cards vs Overlay)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Item Style ──', 'h2' ),

    ea_heading( 'Post Carousel | Item Style: Cards (default)' ),
    ea_widget( 'test-pc-item-cards', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_post_carousel_item_style'   => 'eael-cards',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Item Style: Overlay' ),
    ea_widget( 'test-pc-item-overlay', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_post_carousel_item_style'   => 'eael-overlay',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_image'                 => 'yes',
            'eael_post_block_hover_animation' => 'fade',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Navigation (arrows / dots)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Navigation ──', 'h2' ),

    ea_heading( 'Post Carousel | No Arrows' ),
    ea_widget( 'test-pc-no-arrows', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'arrows'                          => '',
            'dots'                            => 'yes',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | No Dots' ),
    ea_widget( 'test-pc-no-dots', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'arrows'                          => 'yes',
            'dots'                            => '',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Dots Position: Inside' ),
    ea_widget( 'test-pc-dots-inside', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'dots'                            => 'yes',
            'dots_position'                   => 'inside',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Dots Position: Outside (default)' ),
    ea_widget( 'test-pc-dots-outside', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'dots'                            => 'yes',
            'dots_position'                   => 'outside',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Playback (autoplay / loop / marquee / grab cursor)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Playback ──', 'h2' ),

    ea_heading( 'Post Carousel | Autoplay: Off' ),
    ea_widget( 'test-pc-autoplay-off', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'autoplay'                        => '',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Infinite Loop: Off' ),
    ea_widget( 'test-pc-loop-off', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'infinite_loop'                   => '',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Grab Cursor: On' ),
    ea_widget( 'test-pc-grab-on', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'grab_cursor'                     => 'yes',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Marquee: On' ),
    ea_widget( 'test-pc-marquee', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'autoplay'                        => 'yes',
            'enable_marquee'                  => 'yes',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Toggles ──', 'h2' ),

    ea_heading( 'Post Carousel | No Title' ),
    ea_widget( 'test-pc-no-title', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => '',
            'eael_show_excerpt'               => 'yes',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | No Excerpt' ),
    ea_widget( 'test-pc-no-excerpt', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => '',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | No Read More Button' ),
    ea_widget( 'test-pc-no-readmore', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_read_more_button'      => '',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | No Meta' ),
    ea_widget( 'test-pc-no-meta', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_meta'                  => '',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Meta Position
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Meta Position ──', 'h2' ),

    ea_heading( 'Post Carousel | Meta: Entry Footer (default)' ),
    ea_widget( 'test-pc-meta-footer', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_meta'                  => 'yes',
            'eael_show_avatar'                => 'yes',
            'eael_show_author'                => 'yes',
            'eael_show_date'                  => 'yes',
            'meta_position'                   => 'meta-entry-footer',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Meta: Entry Header' ),
    ea_widget( 'test-pc-meta-header', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_meta'                  => 'yes',
            'eael_show_author'                => 'yes',
            'eael_show_date'                  => 'yes',
            'meta_position'                   => 'meta-entry-header',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Title Tag
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Title Tag ──', 'h2' ),

    ea_heading( 'Post Carousel | Title Tag: h2 (default)' ),
    ea_widget( 'test-pc-title-h2', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'title_tag'                       => 'h2',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Title Tag: h3' ),
    ea_widget( 'test-pc-title-h3', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'title_tag'                       => 'h3',
            'eael_show_image'                 => 'yes',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Link Settings
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Link Settings ──', 'h2' ),

    ea_heading( 'Post Carousel | Title Link: target=_blank' ),
    ea_widget( 'test-pc-title-target-blank', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'title_link'                      => 'yes',
            'title_link_target_blank'         => 'true',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Title Link: nofollow' ),
    ea_widget( 'test-pc-title-nofollow', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
            'title_link'                      => 'yes',
            'title_link_nofollow'             => 'true',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Read More Link: nofollow' ),
    ea_widget( 'test-pc-readmore-nofollow', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_read_more_button'      => 'yes',
            'eael_show_image'                 => 'yes',
            'read_more_link_nofollow'         => 'true',
            'posts_per_page'                  => 5,
        ]
    ),

    ea_heading( 'Post Carousel | Read More Link: target=_blank' ),
    ea_widget( 'test-pc-readmore-target-blank', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_show_title'                 => 'yes',
            'eael_show_excerpt'               => 'yes',
            'eael_show_read_more_button'      => 'yes',
            'eael_show_image'                 => 'yes',
            'read_more_link_target_blank'     => 'true',
            'posts_per_page'                  => 5,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Carousel Title (above carousel)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Carousel Title ──', 'h2' ),

    ea_heading( 'Post Carousel | Carousel Title text + h3 tag' ),
    ea_widget( 'test-pc-carousel-title', 'eael-post-carousel',
        [
            'eael_post_carousel_preset_style' => 'one',
            'eael_post_carousel_title'        => 'Latest Stories',
            'eael_post_carousel_title_tag'    => 'h3',
            'eael_show_title'                 => 'yes',
            'eael_show_image'                 => 'yes',
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

WP_CLI::success( 'Post Carousel page ready → /post-carousel/' );
