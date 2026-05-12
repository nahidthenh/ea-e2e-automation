<?php
/**
 * Test page: Offcanvas
 * Run via: wp eval-file /scripts/setup-offcanvas-page.php
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

// - Offcanvas page -------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Offcanvas page ---' );

$slug    = getenv( 'OFFCANVAS_PAGE_SLUG' ) ?: 'offcanvas';
$page_id = ea_upsert_page( $slug, 'Offcanvas' );

$widgets = [

    // ====================================================================
    // Direction Variants
    // ====================================================================

    ea_heading( '- Direction Variants -', 'h2' ),

    ea_heading( 'Default Offcanvas (Left, Slide)' ),
    ea_widget( 'test-o-default', 'eael-offcanvas',
        [
            'button_text'        => 'Open Panel',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'slide',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Default Box One', 'description' => 'First custom content block.' ],
                [ '_id' => ea_make_id(), 'title' => 'Default Box Two', 'description' => 'Second custom content block.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | Direction: Right' ),
    ea_widget( 'test-o-dir-right', 'eael-offcanvas',
        [
            'button_text'        => 'Open Right Panel',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'right',
            'content_transition' => 'slide',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Right Panel Box', 'description' => 'Panel opens from the right side.' ],
            ],
        ]
    ),

    // ====================================================================
    // Content Transitions
    // ====================================================================

    ea_heading( '- Content Transitions -', 'h2' ),

    ea_heading( 'Offcanvas | Transition: Reveal' ),
    ea_widget( 'test-o-trans-reveal', 'eael-offcanvas',
        [
            'button_text'        => 'Reveal',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'reveal',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Reveal Box', 'description' => 'Reveal transition content.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | Transition: Push' ),
    ea_widget( 'test-o-trans-push', 'eael-offcanvas',
        [
            'button_text'        => 'Push',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'push',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Push Box', 'description' => 'Push transition content.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | Transition: Slide Along' ),
    ea_widget( 'test-o-trans-slide-along', 'eael-offcanvas',
        [
            'button_text'        => 'Slide Along',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'slide-along',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Slide Along Box', 'description' => 'Slide along transition content.' ],
            ],
        ]
    ),

    // ====================================================================
    // Panel Features
    // ====================================================================

    ea_heading( '- Panel Features -', 'h2' ),

    ea_heading( 'Offcanvas | With Title' ),
    ea_widget( 'test-o-with-title', 'eael-offcanvas',
        [
            'button_text'          => 'Titled Panel',
            'close_button'         => 'yes',
            'content_type'         => 'custom',
            'direction'            => 'left',
            'content_transition'   => 'slide',
            'eael_offcanvas_title' => 'My Offcanvas',
            'custom_content'       => [
                [ '_id' => ea_make_id(), 'title' => 'Titled Content Box', 'description' => 'Panel has a visible header title.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | No Close Button' ),
    ea_widget( 'test-o-no-close', 'eael-offcanvas',
        [
            'button_text'        => 'No Close',
            'close_button'       => '',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'slide',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'No Close Box', 'description' => 'Panel without a close button.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | Open by Default' ),
    ea_widget( 'test-o-open-default', 'eael-offcanvas',
        [
            'button_text'            => 'Open by Default',
            'close_button'           => 'yes',
            'content_type'           => 'custom',
            'direction'              => 'left',
            'content_transition'     => 'slide',
            'open_offcanvas_default' => 'yes',
            'custom_content'         => [
                [ '_id' => ea_make_id(), 'title' => 'Default Open Box', 'description' => 'Panel is open on page load.' ],
            ],
        ]
    ),

    // ====================================================================
    // Toggle Button Variants
    // ====================================================================

    ea_heading( '- Toggle Button Variants -', 'h2' ),

    ea_heading( 'Offcanvas | Button with Icon' ),
    ea_widget( 'test-o-btn-icon', 'eael-offcanvas',
        [
            'button_text'        => 'Menu',
            'button_icon_new'    => [ 'value' => 'eicon-menu-bar', 'library' => 'eicons' ],
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'slide',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Icon Button Box', 'description' => 'Toggle button has an icon.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | Button Align: Center' ),
    ea_widget( 'test-o-btn-align-center', 'eael-offcanvas',
        [
            'button_text'        => 'Center Button',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'slide',
            'button_align'       => 'center',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Center Align Box', 'description' => 'Toggle button is centered.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | Button Align: Right' ),
    ea_widget( 'test-o-btn-align-right', 'eael-offcanvas',
        [
            'button_text'        => 'Right Button',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'slide',
            'button_align'       => 'right',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Right Align Box', 'description' => 'Toggle button is right-aligned.' ],
            ],
        ]
    ),

    ea_heading( 'Offcanvas | Button Size: Large' ),
    ea_widget( 'test-o-btn-size-lg', 'eael-offcanvas',
        [
            'button_text'        => 'Large Button',
            'button_size'        => 'lg',
            'close_button'       => 'yes',
            'content_type'       => 'custom',
            'direction'          => 'left',
            'content_transition' => 'slide',
            'custom_content'     => [
                [ '_id' => ea_make_id(), 'title' => 'Large Button Box', 'description' => 'Toggle button is large size.' ],
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

WP_CLI::success( 'Offcanvas page ready → /' . $slug . '/' );
