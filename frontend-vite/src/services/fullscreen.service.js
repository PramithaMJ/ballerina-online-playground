/**
 * Fullscreen Service
 * Handles fullscreen API with cross-browser support
 * Single Responsibility: Fullscreen operations
 */

class FullscreenService {
  /**
   * Enter fullscreen mode
   * @returns {Promise<void>}
   */
  async enter() {
    try {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      console.error('Error entering fullscreen:', err);
      throw err;
    }
  }

  /**
   * Exit fullscreen mode
   * @returns {Promise<void>}
   */
  async exit() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.error('Error exiting fullscreen:', err);
      throw err;
    }
  }

  /**
   * Toggle fullscreen mode
   * @returns {Promise<void>}
   */
  async toggle() {
    if (this.isFullscreen()) {
      await this.exit();
    } else {
      await this.enter();
    }
  }

  /**
   * Check if currently in fullscreen mode
   * @returns {boolean}
   */
  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  /**
   * Add fullscreen change event listener
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function
   */
  addChangeListener(callback) {
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];

    events.forEach(event => {
      document.addEventListener(event, callback);
    });

    // Return cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, callback);
      });
    };
  }
}

// Singleton instance
export const fullscreenService = new FullscreenService();

export default fullscreenService;
