<?php
/**
 * Test page: Login / Register
 * Run via: wp eval-file /scripts/setup-login-register-page.php
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

// - Login / Register page --------------------------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Login / Register page ---' );

// Enable user registration so the register form renders.
update_option( 'users_can_register', 1 );
WP_CLI::log( '  site    : users_can_register = 1' );

$slug    = getenv( 'LOGIN_REGISTER_PAGE_SLUG' ) ?: 'login-register';
$page_id = ea_upsert_page( $slug, 'Login / Register' );

$widgets = [

    // ======================================================================
    // Default form type variants
    // ======================================================================

    ea_heading( '- Login Form (default) -', 'h2' ),

    ea_heading( 'Login / Register | Login Form (default)' ),
    ea_widget( 'test-lr-default', 'eael-login-register',
        [
            'default_form_type'       => 'login',
            'show_lost_password'      => 'yes',
            'login_show_remember_me'  => 'yes',
            'show_register_link'      => 'yes',
            'registration_link_action'=> 'form',
        ]
    ),

    ea_heading( '- Register Form -', 'h2' ),

    ea_heading( 'Login / Register | Register Form as Default' ),
    ea_widget( 'test-lr-register', 'eael-login-register',
        [
            'default_form_type'  => 'register',
            'show_login_link'    => 'yes',
            'login_link_action'  => 'form',
        ]
    ),

    ea_heading( '- Lost Password Form -', 'h2' ),

    ea_heading( 'Login / Register | Lost Password Form as Default' ),
    ea_widget( 'test-lr-lostpw', 'eael-login-register',
        [
            'default_form_type'              => 'lostpassword',
            'show_login_link_lostpassword'   => 'yes',
            'login_link_action_lostpassword' => 'form',
        ]
    ),

    // ======================================================================
    // Content toggles
    // ======================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'Login / Register | No Lost Password Link' ),
    ea_widget( 'test-lr-no-lostpw', 'eael-login-register',
        [
            'default_form_type'  => 'login',
            'show_lost_password' => '',
        ]
    ),

    ea_heading( 'Login / Register | No Remember Me' ),
    ea_widget( 'test-lr-no-remember', 'eael-login-register',
        [
            'default_form_type'      => 'login',
            'login_show_remember_me' => '',
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

WP_CLI::success( 'Login / Register page ready -> /' . $slug . '/' );
