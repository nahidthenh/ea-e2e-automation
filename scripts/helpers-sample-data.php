<?php
/**
 * Shared helpers for sample data setup scripts.
 * Included by setup-sample-posts.php and setup-sample-products.php.
 */

if ( ! function_exists( 'ea_create_placeholder_image' ) ) {
    function ea_create_placeholder_image( string $title, string $hex = '#4a90d9' ): int {
        if ( ! function_exists( 'imagecreatetruecolor' ) ) {
            return 0;
        }

        $w = 800; $h = 500;
        $img = imagecreatetruecolor( $w, $h );

        list( $r, $g, $b ) = sscanf( $hex, '#%02x%02x%02x' );
        $bg   = imagecolorallocate( $img, $r, $g, $b );
        $fg   = imagecolorallocate( $img, 255, 255, 255 );
        $grey = imagecolorallocate( $img, $r - 20 > 0 ? $r - 20 : 0, $g - 20 > 0 ? $g - 20 : 0, $b - 20 > 0 ? $b - 20 : 0 );

        imagefill( $img, 0, 0, $bg );

        // Simple bottom strip
        imagefilledrectangle( $img, 0, $h - 80, $w, $h, $grey );

        // Title text (built-in font, no ttf needed)
        $label = mb_substr( $title, 0, 36 );
        imagestring( $img, 5, 20, $h - 56, $label, $fg );

        $upload = wp_upload_dir();
        $slug   = sanitize_title( $title );
        $file   = $upload['path'] . "/ea-placeholder-{$slug}.jpg";
        imagejpeg( $img, $file, 85 );
        imagedestroy( $img );

        $attach_id = wp_insert_attachment( [
            'post_mime_type' => 'image/jpeg',
            'post_title'     => $title,
            'post_status'    => 'inherit',
        ], $file );

        require_once ABSPATH . 'wp-admin/includes/image.php';
        wp_update_attachment_metadata( $attach_id, wp_generate_attachment_metadata( $attach_id, $file ) );

        return (int) $attach_id;
    }
}
