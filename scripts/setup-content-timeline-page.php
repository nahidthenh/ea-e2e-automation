<?php
/**
 * Test page: Content Timeline
 * Run via: wp eval-file /scripts/setup-content-timeline-page.php
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

// ── Content Timeline page ──────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Content Timeline page ---' );

$slug    = getenv( 'CONTENT_TIMELINE_PAGE_SLUG' ) ?: 'content-timeline';
$page_id = ea_upsert_page( $slug, 'Content Timeline' );

// ── Reusable repeater items ─────────────────────────────────────────────────

function ct_item( string $title, string $date, string $excerpt = '', array $link_override = [] ): array {
    $link = array_merge(
        [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        $link_override
    );
    return [
        'eael_custom_title'                            => $title,
        'eael_custom_excerpt'                          => $excerpt ?: '<p>Timeline item content for ' . esc_html( $title ) . '.</p>',
        'eael_custom_post_date'                        => $date,
        'eael_show_custom_image_or_icon'               => 'icon',
        'eael_custom_content_timeline_circle_icon_new' => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        'eael_show_custom_read_more'                   => '1',
        'eael_show_custom_read_more_text'              => 'Read More',
        'eael_read_more_text_link'                     => $link,
    ];
}

function ct_bullet_item( string $title, string $date ): array {
    return [
        'eael_custom_title'          => $title,
        'eael_custom_excerpt'        => '<p>Bullet item: ' . esc_html( $title ) . '</p>',
        'eael_custom_post_date'      => $date,
        'eael_show_custom_image_or_icon' => 'bullet',
        'eael_show_custom_read_more' => '1',
        'eael_show_custom_read_more_text' => 'Read More',
        'eael_read_more_text_link'   => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ];
}

$default_items = [
    ct_item( 'Alpha Event', 'Jan 01, 2024', '<p>First timeline entry — Alpha.</p>' ),
    ct_item( 'Beta Event',  'Feb 15, 2024', '<p>Second timeline entry — Beta.</p>' ),
    ct_item( 'Gamma Event', 'Mar 30, 2024', '<p>Third timeline entry — Gamma.</p>' ),
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Layout Positions
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layout Positions ──', 'h2' ),

    ea_heading( 'Default Content Timeline (Center)' ),
    ea_widget( 'test-ct-default', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => $default_items,
        ]
    ),

    ea_heading( 'Content Timeline | Position: Left' ),
    ea_widget( 'test-ct-layout-left', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'left',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                ct_item( 'Left Alpha', 'Jan 01, 2024' ),
                ct_item( 'Left Beta',  'Feb 15, 2024' ),
            ],
        ]
    ),

    ea_heading( 'Content Timeline | Position: Right' ),
    ea_widget( 'test-ct-layout-right', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'right',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                ct_item( 'Right Alpha', 'Jan 01, 2024' ),
                ct_item( 'Right Beta',  'Feb 15, 2024' ),
            ],
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Circle Icon Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Circle Icon Variants ──', 'h2' ),

    ea_heading( 'Content Timeline | Circle: Bullet' ),
    ea_widget( 'test-ct-bullet', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_image_or_icon'       => 'bullet',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                ct_bullet_item( 'Bullet Alpha', 'Apr 01, 2024' ),
                ct_bullet_item( 'Bullet Beta',  'May 15, 2024' ),
            ],
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Visibility Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Visibility Toggles ──', 'h2' ),

    ea_heading( 'Content Timeline | Title Hidden' ),
    ea_widget( 'test-ct-no-title', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_title'               => 'no',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                ct_item( 'Hidden Title Item', 'Jun 01, 2024' ),
            ],
        ]
    ),

    ea_heading( 'Content Timeline | Excerpt Hidden' ),
    ea_widget( 'test-ct-no-excerpt', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'no',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                ct_item( 'No Excerpt Item', 'Jul 01, 2024' ),
            ],
        ]
    ),

    ea_heading( 'Content Timeline | Read More Hidden' ),
    ea_widget( 'test-ct-no-readmore', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                [
                    'eael_custom_title'                            => 'No Read More Item',
                    'eael_custom_excerpt'                          => '<p>Read more button is hidden on this item.</p>',
                    'eael_custom_post_date'                        => 'Aug 01, 2024',
                    'eael_show_custom_image_or_icon'               => 'icon',
                    'eael_custom_content_timeline_circle_icon_new' => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
                    'eael_show_custom_read_more'                   => '0',
                    'eael_show_custom_read_more_text'              => 'Read More',
                    'eael_read_more_text_link'                     => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
                ],
            ],
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Title Tag
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Title Tag Variants ──', 'h2' ),

    ea_heading( 'Content Timeline | Title as H3' ),
    ea_widget( 'test-ct-title-h3', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h3',
            'eael_coustom_content_posts'    => [
                ct_item( 'H3 Title Event', 'Sep 01, 2024' ),
            ],
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Link Behaviour
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Link Behaviour ──', 'h2' ),

    ea_heading( 'Content Timeline | External Link (target=_blank)' ),
    ea_widget( 'test-ct-external', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                ct_item( 'External Link Event', 'Oct 01, 2024', '', [ 'url' => '#', 'is_external' => 'on', 'nofollow' => '' ] ),
            ],
        ]
    ),

    ea_heading( 'Content Timeline | Nofollow Link' ),
    ea_widget( 'test-ct-nofollow', 'eael-content-timeline',
        [
            'eael_content_timeline_choose'  => 'custom',
            'eael_dynamic_template_Layout'  => 'default',
            'content_timeline_layout'       => 'center',
            'eael_show_title'               => 'yes',
            'eael_show_excerpt'             => 'yes',
            'title_tag'                     => 'h2',
            'eael_coustom_content_posts'    => [
                ct_item( 'Nofollow Link Event', 'Nov 01, 2024', '', [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on' ] ),
            ],
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

WP_CLI::success( 'Content Timeline page ready → /content-timeline/' );
