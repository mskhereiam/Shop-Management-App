/**
 * Utility functions for converting and validating GitHub Repository Image URLs
 */

export interface GitHubUploadSettings {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  folderPath: string;
}

export const defaultGitHubUploadSettings: GitHubUploadSettings = {
  token: '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',
  owner: 'oliurtech-create',
  repo: 'images-tech',
  branch: 'main',
  folderPath: 'products'
};

export async function uploadImageToGitHubRepo(
  file: File,
  settings: GitHubUploadSettings
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!settings.token || !settings.owner || !settings.repo) {
      return {
        success: false,
        error: 'Please configure GitHub Personal Access Token, Repository Owner, and Repository Name.'
      };
    }

    // Convert file to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:image/...;base64, prefix
        const base64Content = result.split(',')[1] || '';
        resolve(base64Content);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const folder = settings.folderPath ? settings.folderPath.replace(/^\/+|\/+$/g, '') : 'products';
    const filePath = `${folder}/${timestamp}_${cleanFileName}.${fileExt}`;

    const apiEndpoint = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${filePath}`;

    const response = await fetch(apiEndpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${settings.token.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Upload product image ${file.name} via ShopMind AI`,
        content: base64Data,
        branch: settings.branch || 'main'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `GitHub API error: ${response.statusText}`
      };
    }

    // Direct raw CDN URL
    const rawUrl = `https://raw.githubusercontent.com/${settings.owner}/${settings.repo}/${settings.branch || 'main'}/${filePath}`;

    return {
      success: true,
      url: rawUrl
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during GitHub upload.'
    };
  }
}

export function formatGitHubImageURL(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();

  // If user pasted a standard GitHub web URL for a blob/file:
  // e.g. https://github.com/user/repo/blob/main/images/product.png
  const githubBlobRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i;
  if (githubBlobRegex.test(cleaned)) {
    cleaned = cleaned.replace(githubBlobRegex, 'https://raw.githubusercontent.com/$1/$2/$3/$4');
  }

  // e.g. https://github.com/user/repo/raw/main/images/product.png
  const githubRawRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/raw\/([^\/]+)\/(.+)$/i;
  if (githubRawRegex.test(cleaned)) {
    cleaned = cleaned.replace(githubRawRegex, 'https://raw.githubusercontent.com/$1/$2/$3/$4');
  }

  // e.g. user/repo/main/path/to/image.png
  const shorthandRegex = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)\/(.+\.(png|jpg|jpeg|gif|webp|svg))$/i;
  if (shorthandRegex.test(cleaned)) {
    cleaned = cleaned.replace(shorthandRegex, 'https://raw.githubusercontent.com/$1/$2/$3/$4');
  }

  return cleaned;
}

export function isGitHubImageURL(url: string): boolean {
  if (!url) return false;
  return url.includes('github.com') || url.includes('raw.githubusercontent.com') || url.includes('githubusercontent');
}

export interface GitHubRepoConfig {
  owner: string;
  repo: string;
  branch: string;
  folderPath: string;
}

export const sampleGitHubRepoImages = [
  {
    name: 'Wireless Ergonomic Mouse',
    url: 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.png'
  },
  {
    name: 'GitHub Octocat Mascot',
    url: 'https://raw.githubusercontent.com/github/explore/main/topics/github/github.png'
  },
  {
    name: 'Electronics Gadget',
    url: 'https://raw.githubusercontent.com/microsoft/vscode/main/resources/win32/code_70x70.png'
  },
  {
    name: 'React Logo Visual',
    url: 'https://raw.githubusercontent.com/facebook/react/main/fixtures/dom/public/react-logo.svg'
  }
];
