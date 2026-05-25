<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'mazzahub' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', '' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'u`0zRXhDK;i+>@|tK$*vLu|]2gdgrUjWz..}6E]L6V3v[;icR} pGO7!l?PD^luJ' );
define( 'SECURE_AUTH_KEY',  ' 6Wd(@5wJqpP`TF7}r9A-sNFcjvkG7%k*(-KJSRikQs{Zi/be]G$f,o&JO;{`Pvk' );
define( 'LOGGED_IN_KEY',    'XM6ZOyR)60|Ao3g4c7SjiEn+ZA|(iX3(dnhMS:-u(|4XW%R.{Z^r53$*;xTU_*[1' );
define( 'NONCE_KEY',        'O]D{q?ml=3$f){4qx4Qs&uPn`zOR%z!pO|ubDLHEv5]oZqD}#un~4+A;&!R&z_&h' );
define( 'AUTH_SALT',        '>L1(A?fDC@>P{@#%8Y={dh@WK7<[C;*gn+@t JTpk%T@SzFT$~hx=C`HssNq8_}Z' );
define( 'SECURE_AUTH_SALT', 'XSdu#%4Pzppr@qRA[eb8OmK/SHu<Vsg0Jo0o/5W )<R `[K; o-jL* |Hr$Zbvm6' );
define( 'LOGGED_IN_SALT',   '01gZjby!@FAW9*4lwJn5#K:2Ggwtpy6pEE*OBP.ob]v~!&(/|8%bv|E%:T@JsaPX' );
define( 'NONCE_SALT',       '7b2[8C!4)iXIM/>9s?$(D3C3J30(&LvHn~4]Z$lz_3o9DYwx@d@)+A0$TQ17e+LI' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'mazzahub_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
