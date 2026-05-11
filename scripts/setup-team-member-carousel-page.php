<?php
/**
 * Test page: Team Member Carousel
 * Run via: wp eval-file /scripts/setup-team-member-carousel-page.php
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

// ── Team Member Carousel page ──────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Team Member Carousel page ---' );

$slug    = getenv( 'TEAM_MEMBER_CAROUSEL_PAGE_SLUG' ) ?: 'team-member-carousel';
$page_id = ea_upsert_page( $slug, 'Team Member Carousel' );

// Elementor's built-in placeholder — always present in the container.
$placeholder = get_site_url() . '/wp-content/plugins/elementor/assets/images/placeholder.png';

// Three distinct members used across all test configurations.
$members = [
    [
        'team_member_name'        => 'Alice Johnson',
        'team_member_position'    => 'Lead Developer',
        'team_member_description' => 'Alice specializes in backend development and cloud infrastructure.',
        'team_member_image'       => [ 'url' => $placeholder ],
        'facebook_url'            => '#',
        'twitter_url'             => '#',
        'linkedin_url'            => '#',
    ],
    [
        'team_member_name'        => 'Bob Smith',
        'team_member_position'    => 'UI/UX Designer',
        'team_member_description' => 'Bob creates intuitive interfaces and engaging user experiences.',
        'team_member_image'       => [ 'url' => $placeholder ],
        'facebook_url'            => '#',
        'twitter_url'             => '#',
    ],
    [
        'team_member_name'        => 'Carol White',
        'team_member_position'    => 'Project Manager',
        'team_member_description' => 'Carol coordinates project timelines and stakeholder communication.',
        'team_member_image'       => [ 'url' => $placeholder ],
        'facebook_url'            => '#',
    ],
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Default / Baseline
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Default / Baseline ──', 'h2' ),

    ea_heading( 'Default Team Member Carousel' ),
    ea_widget( 'test-tmc-default', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Overlay Content Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Overlay Content Variants ──', 'h2' ),

    ea_heading( 'Team Member Carousel | Overlay: Social Icons' ),
    ea_widget( 'test-tmc-overlay-social', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
            'overlay_content'     => 'social_icons',
        ]
    ),

    ea_heading( 'Team Member Carousel | Overlay: Description + Social Icons' ),
    ea_widget( 'test-tmc-overlay-all', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
            'overlay_content'     => 'all_content',
        ]
    ),

    ea_heading( 'Team Member Carousel | Overlay: All Content' ),
    ea_widget( 'test-tmc-overlay-atoz', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
            'overlay_content'     => 'atoz_content',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Navigation Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Navigation Variants ──', 'h2' ),

    ea_heading( 'Team Member Carousel | No Arrows' ),
    ea_widget( 'test-tmc-no-arrows', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
            'arrows'              => '',
        ]
    ),

    ea_heading( 'Team Member Carousel | No Dots' ),
    ea_widget( 'test-tmc-no-dots', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
            'dots'                => '',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Social Links
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Social Links ──', 'h2' ),

    ea_heading( 'Team Member Carousel | Social Links: Hidden' ),
    ea_widget( 'test-tmc-no-social', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
            'member_social_links' => '',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Member HTML Tags
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Member HTML Tags ──', 'h2' ),

    ea_heading( 'Team Member Carousel | Name Tag: h2' ),
    ea_widget( 'test-tmc-name-h2', 'eael-team-member-carousel',
        [
            'team_member_details' => $members,
            'name_html_tag'       => 'h2',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Box Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Box Alignment ──', 'h2' ),

    ea_heading( 'Team Member Carousel | Align: Center' ),
    ea_widget( 'test-tmc-align-center', 'eael-team-member-carousel',
        [
            'team_member_details'  => $members,
            'member_box_alignment' => 'center',
        ]
    ),

    ea_heading( 'Team Member Carousel | Align: Right' ),
    ea_widget( 'test-tmc-align-right', 'eael-team-member-carousel',
        [
            'team_member_details'  => $members,
            'member_box_alignment' => 'right',
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

WP_CLI::success( 'Team Member Carousel page ready → /' . $slug . '/' );
