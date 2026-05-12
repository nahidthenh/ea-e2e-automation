<?php
/**
 * Test page: Image Comparison
 * Run via: wp eval-file /scripts/setup-image-comparison-page.php
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

// - Image Comparison page -------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Image Comparison page ---' );

$slug    = getenv( 'IMAGE_COMPARISON_PAGE_SLUG' ) ?: 'image-comparison';
$page_id = ea_upsert_page( $slug, 'Image Comparison' );

// Import a placeholder image into the media library so Elementor's MEDIA
// control has a real attachment ID to render (bare url with id=0 is skipped).
$placeholder_src = WP_PLUGIN_DIR
    . '/essential-addons-for-elementor-lite/assets/front-end/img/accordion.png';

// Fallback path in case the free plugin image isn't found
if ( ! file_exists( $placeholder_src ) ) {
    $placeholder_src = WP_PLUGIN_DIR
        . '/essential-addons-elementor/assets/front-end/img/accordion.png';
}

$existing = get_posts( [
    'post_type'   => 'attachment',
    'meta_key'    => '_ea_ic_placeholder',
    'meta_value'  => '1',
    'fields'      => 'ids',
    'numberposts' => 1,
] );

if ( $existing ) {
    $ea_img_id  = (int) $existing[0];
    $ea_img_url = wp_get_attachment_url( $ea_img_id );
    WP_CLI::log( "  image   : reusing attachment ID {$ea_img_id}" );
} elseif ( file_exists( $placeholder_src ) ) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $tmp = wp_tempnam( 'ic-placeholder.png' );
    copy( $placeholder_src, $tmp );
    $file_array = [ 'name' => 'ic-placeholder.png', 'tmp_name' => $tmp ];
    $ea_img_id  = media_handle_sideload( $file_array, 0, 'EA Image Comparison Placeholder' );
    if ( is_wp_error( $ea_img_id ) ) {
        WP_CLI::error( 'Could not import image: ' . $ea_img_id->get_error_message() );
    }
    update_post_meta( $ea_img_id, '_ea_ic_placeholder', '1' );
    $ea_img_url = wp_get_attachment_url( $ea_img_id );
    WP_CLI::log( "  image   : imported as attachment ID {$ea_img_id} → {$ea_img_url}" );
} else {
    // Use WordPress's built-in placeholder as last resort
    $ea_img_id  = 0;
    $ea_img_url = includes_url( 'images/media/default.png' );
    WP_CLI::log( "  image   : using WP default placeholder (no attachment)" );
}

$ic_img = [ 'url' => $ea_img_url, 'id' => $ea_img_id ];

$widgets = [

    // ====================================================================
    // Orientation
    // ====================================================================

    ea_heading( '- Orientation -', 'h2' ),

    ea_heading( 'Default Image Comparison (horizontal, no interaction)' ),
    ea_widget( 'test-ic-default', 'eael-image-comparison',
        [
            'before_image'                  => $ic_img,
            'after_image'                   => $ic_img,
            'before_image_label'            => 'Before',
            'after_image_label'             => 'After',
            'eael_image_comp_orientation'   => 'horizontal',
            'eael_image_comp_interaction'   => 'none',
            'eael_image_comp_overlay'       => 'yes',
            'eael_image_comp_offset'        => [ 'size' => 70, 'unit' => '%' ],
        ]
    ),

    ea_heading( 'Image Comparison | Orientation: Vertical' ),
    ea_widget( 'test-ic-vertical', 'eael-image-comparison',
        [
            'before_image'                => $ic_img,
            'after_image'                 => $ic_img,
            'before_image_label'          => 'Before',
            'after_image_label'           => 'After',
            'eael_image_comp_orientation' => 'vertical',
            'eael_image_comp_interaction' => 'none',
        ]
    ),

    // ====================================================================
    // Slider Interaction
    // ====================================================================

    ea_heading( '- Slider Interaction -', 'h2' ),

    ea_heading( 'Image Comparison | Interaction: Click' ),
    ea_widget( 'test-ic-interaction-click', 'eael-image-comparison',
        [
            'before_image'                => $ic_img,
            'after_image'                 => $ic_img,
            'eael_image_comp_interaction' => 'click',
        ]
    ),

    ea_heading( 'Image Comparison | Interaction: Hover' ),
    ea_widget( 'test-ic-interaction-hover', 'eael-image-comparison',
        [
            'before_image'                => $ic_img,
            'after_image'                 => $ic_img,
            'eael_image_comp_interaction' => 'hover',
        ]
    ),

    ea_heading( 'Image Comparison | Interaction: Toggle (text buttons)' ),
    ea_widget( 'test-ic-interaction-toggle', 'eael-image-comparison',
        [
            'before_image'                => $ic_img,
            'after_image'                 => $ic_img,
            'eael_image_comp_interaction' => 'toggle',
            'eael_toggle_content_type'    => 'text',
            'eael_toggle_before_text'     => 'Show Before',
            'eael_toggle_after_text'      => 'Show After',
        ]
    ),

    ea_heading( 'Image Comparison | Toggle: Icon only' ),
    ea_widget( 'test-ic-toggle-icon', 'eael-image-comparison',
        [
            'before_image'                => $ic_img,
            'after_image'                 => $ic_img,
            'eael_image_comp_interaction' => 'toggle',
            'eael_toggle_content_type'    => 'icon',
            'eael_toggle_before_icon'     => [ 'value' => 'eicon-arrow-left', 'library' => 'eicons' ],
            'eael_toggle_after_icon'      => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        ]
    ),

    ea_heading( 'Image Comparison | Toggle: Text & Icon' ),
    ea_widget( 'test-ic-toggle-both', 'eael-image-comparison',
        [
            'before_image'                => $ic_img,
            'after_image'                 => $ic_img,
            'eael_image_comp_interaction' => 'toggle',
            'eael_toggle_content_type'    => 'both',
            'eael_toggle_before_text'     => 'Before',
            'eael_toggle_after_text'      => 'After',
            'eael_toggle_before_icon'     => [ 'value' => 'eicon-arrow-left', 'library' => 'eicons' ],
            'eael_toggle_after_icon'      => [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ],
        ]
    ),

    // ====================================================================
    // Overlay
    // ====================================================================

    ea_heading( '- Overlay -', 'h2' ),

    ea_heading( 'Image Comparison | Overlay: Off' ),
    ea_widget( 'test-ic-overlay-off', 'eael-image-comparison',
        [
            'before_image'            => $ic_img,
            'after_image'             => $ic_img,
            'eael_image_comp_overlay' => '',
        ]
    ),

    // ====================================================================
    // Custom Labels
    // ====================================================================

    ea_heading( '- Labels -', 'h2' ),

    ea_heading( 'Image Comparison | Custom Labels' ),
    ea_widget( 'test-ic-custom-labels', 'eael-image-comparison',
        [
            'before_image'       => $ic_img,
            'after_image'        => $ic_img,
            'before_image_label' => 'Original',
            'after_image_label'  => 'Edited',
        ]
    ),

    // ====================================================================
    // Offset
    // ====================================================================

    ea_heading( '- Offset -', 'h2' ),

    ea_heading( 'Image Comparison | Offset: 30%' ),
    ea_widget( 'test-ic-offset-30', 'eael-image-comparison',
        [
            'before_image'           => $ic_img,
            'after_image'            => $ic_img,
            'eael_image_comp_offset' => [ 'size' => 30, 'unit' => '%' ],
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

WP_CLI::success( 'Image Comparison page ready → /' . $slug . '/' );
