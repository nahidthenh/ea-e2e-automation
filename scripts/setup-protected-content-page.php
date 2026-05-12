<?php
/**
 * Test page: Protected Content
 * Run via: wp eval-file /scripts/setup-protected-content-page.php
 *
 * Note: This is a Pro-only widget (ea-plugins/essential-addons-elementor).
 * Test visitors are unauthenticated, so role-protected instances always show
 * the permission message. Password-protected instances show the form.
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

// - Protected Content page -------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Protected Content page ---' );

$slug    = getenv( 'PROTECTED_CONTENT_PAGE_SLUG' ) ?: 'protected-content';
$page_id = ea_upsert_page( $slug, 'Protected Content' );

$widgets = [

    // ====================================================================
    // Role-Based Protection
    // ====================================================================

    ea_heading( '- Role-Based Protection -', 'h2' ),

    ea_heading( 'Default Protected Content' ),
    ea_widget( 'test-pc-default', 'eael-protected-content',
        [
            'eael_protected_content_protection_type' => 'role',
            'eael_protected_content_field'           => 'This is role-protected content visible only to authorised users.',
            'eael_protected_content_message_type'    => 'text',
            'eael_protected_content_message_text'    => 'You do not have permission to see this content.',
        ]
    ),

    ea_heading( 'Protected Content | Message Type: None' ),
    ea_widget( 'test-pc-message-none', 'eael-protected-content',
        [
            'eael_protected_content_protection_type' => 'role',
            'eael_protected_content_field'           => 'Hidden role-protected content.',
            'eael_protected_content_message_type'    => 'none',
        ]
    ),

    ea_heading( 'Protected Content | Custom Message' ),
    ea_widget( 'test-pc-message-custom', 'eael-protected-content',
        [
            'eael_protected_content_protection_type' => 'role',
            'eael_protected_content_field'           => 'Members-only content goes here.',
            'eael_protected_content_message_type'    => 'text',
            'eael_protected_content_message_text'    => 'Restricted to Members Only',
        ]
    ),

    // ====================================================================
    // Password Protection
    // ====================================================================

    ea_heading( '- Password Protection -', 'h2' ),

    ea_heading( 'Protected Content | Password Form (defaults)' ),
    ea_widget( 'test-pc-password-form', 'eael-protected-content',
        [
            'eael_protected_content_protection_type'  => 'password',
            'protection_password'                     => 'ea_test_pass',
            'protection_password_placeholder'         => 'Enter Password',
            'protection_password_submit_btn_txt'      => 'Submit',
            'eael_protected_content_message_type'     => 'text',
            'eael_protected_content_message_text'     => 'Enter the password to access this content.',
            'eael_protected_content_field'            => 'Secret password-protected content.',
        ]
    ),

    ea_heading( 'Protected Content | Custom Placeholder' ),
    ea_widget( 'test-pc-password-placeholder', 'eael-protected-content',
        [
            'eael_protected_content_protection_type'  => 'password',
            'protection_password'                     => 'ea_test_pass',
            'protection_password_placeholder'         => 'Type your secret key',
            'protection_password_submit_btn_txt'      => 'Submit',
            'eael_protected_content_message_type'     => 'text',
            'eael_protected_content_message_text'     => 'Enter the password to access this content.',
            'eael_protected_content_field'            => 'Secret password-protected content.',
        ]
    ),

    ea_heading( 'Protected Content | Custom Button Text' ),
    ea_widget( 'test-pc-password-btn', 'eael-protected-content',
        [
            'eael_protected_content_protection_type'  => 'password',
            'protection_password'                     => 'ea_test_pass',
            'protection_password_placeholder'         => 'Enter Password',
            'protection_password_submit_btn_txt'      => 'Unlock',
            'eael_protected_content_message_type'     => 'text',
            'eael_protected_content_message_text'     => 'Enter the password to access this content.',
            'eael_protected_content_field'            => 'Secret password-protected content.',
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

WP_CLI::success( 'Protected Content page ready → /protected-content/' );
