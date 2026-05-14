<?php
/**
 * Test page: Sticky Video
 * Run via: wp eval-file /scripts/setup-sticky-video-page.php
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

// - Sticky Video page ---------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Sticky Video page ---' );

$slug    = getenv( 'STICKY_VIDEO_PAGE_SLUG' ) ?: 'sticky-video';
$page_id = ea_upsert_page( $slug, 'Sticky Video' );

$widgets = [

    // ====================================================================
    // Video Sources
    // ====================================================================

    ea_heading( '- Video Sources -', 'h2' ),

    ea_heading( 'Default Sticky Video (YouTube)' ),
    ea_widget( 'test-sv-default', 'eael-sticky-video',
        [
            'eael_video_source'    => 'youtube',
            'eaelsv_link_youtube'  => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'     => 'yes',
            'eaelsv_sticky_position' => 'bottom-right',
        ]
    ),

    ea_heading( 'Sticky Video | Source: Vimeo' ),
    ea_widget( 'test-sv-source-vimeo', 'eael-sticky-video',
        [
            'eael_video_source'   => 'vimeo',
            'eaelsv_link_vimeo'   => 'https://vimeo.com/235215203',
            'eaelsv_is_sticky'    => 'yes',
            'eaelsv_sticky_position' => 'bottom-right',
        ]
    ),

    ea_heading( 'Sticky Video | Source: Self-Hosted (External URL)' ),
    ea_widget( 'test-sv-source-self-hosted', 'eael-sticky-video',
        [
            'eael_video_source'    => 'self_hosted',
            'eaelsv_link_external' => 'yes',
            'eaelsv_external_url'  => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            'eaelsv_is_sticky'     => 'yes',
        ]
    ),

    // ====================================================================
    // Sticky Behaviour
    // ====================================================================

    ea_heading( '- Sticky Behaviour -', 'h2' ),

    ea_heading( 'Sticky Video | Sticky: Off' ),
    ea_widget( 'test-sv-sticky-off', 'eael-sticky-video',
        [
            'eael_video_source'   => 'youtube',
            'eaelsv_link_youtube' => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'    => '',
        ]
    ),

    // ====================================================================
    // Sticky Position Variants
    // ====================================================================

    ea_heading( '- Sticky Positions -', 'h2' ),

    ea_heading( 'Sticky Video | Position: Top Left' ),
    ea_widget( 'test-sv-pos-top-left', 'eael-sticky-video',
        [
            'eael_video_source'      => 'youtube',
            'eaelsv_link_youtube'    => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'       => 'yes',
            'eaelsv_sticky_position' => 'top-left',
        ]
    ),

    ea_heading( 'Sticky Video | Position: Top Right' ),
    ea_widget( 'test-sv-pos-top-right', 'eael-sticky-video',
        [
            'eael_video_source'      => 'youtube',
            'eaelsv_link_youtube'    => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'       => 'yes',
            'eaelsv_sticky_position' => 'top-right',
        ]
    ),

    ea_heading( 'Sticky Video | Position: Bottom Left' ),
    ea_widget( 'test-sv-pos-bottom-left', 'eael-sticky-video',
        [
            'eael_video_source'      => 'youtube',
            'eaelsv_link_youtube'    => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'       => 'yes',
            'eaelsv_sticky_position' => 'bottom-left',
        ]
    ),

    // ====================================================================
    // Overlay Options
    // ====================================================================

    ea_heading( '- Overlay Options -', 'h2' ),

    ea_heading( 'Sticky Video | Overlay: Transparent' ),
    ea_widget( 'test-sv-overlay-transparent', 'eael-sticky-video',
        [
            'eael_video_source'       => 'youtube',
            'eaelsv_link_youtube'     => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'        => 'yes',
            'eaelsv_overlay_options'  => 'transparent',
        ]
    ),

    // ====================================================================
    // Playback Options
    // ====================================================================

    ea_heading( '- Playback Options -', 'h2' ),

    ea_heading( 'Sticky Video | Autoplay: On (muted)' ),
    ea_widget( 'test-sv-autoplay', 'eael-sticky-video',
        [
            'eael_video_source'   => 'youtube',
            'eaelsv_link_youtube' => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'    => 'yes',
            'eaelsv_autopaly'     => 'yes',
        ]
    ),

    ea_heading( 'Sticky Video | Loop: On' ),
    ea_widget( 'test-sv-loop', 'eael-sticky-video',
        [
            'eael_video_source'   => 'youtube',
            'eaelsv_link_youtube' => 'https://www.youtube.com/watch?v=uuyXfUDqRZM',
            'eaelsv_is_sticky'    => 'yes',
            'eaelsv_loop'         => 'yes',
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

WP_CLI::success( 'Sticky Video page ready → /sticky-video/' );
