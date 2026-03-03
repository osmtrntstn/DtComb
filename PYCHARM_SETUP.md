# PyCharm Configuration Notes

## Port 3838 Configuration

The DtComb application is configured to run on **port 3838** (not the FastAPI default port 8000).

### Why Port 3838?

Port 3838 is the standard port for Shiny Server and R-based applications, making it more intuitive for biostatisticians and R users.

### Run Configurations

Your `.idea/workspace.xml` has been configured with the following options:

```xml
<configuration name="DtComb" type="Python.FastAPI">
  <option name="additionalOptions" value="--host 0.0.0.0 --port 3838 --reload" />
  <option name="file" value="$PROJECT_DIR$/main.py" />
  ...
</configuration>
```

### How to Run from PyCharm

1. **Method 1: Use FastAPI Configuration (Recommended)**
   - Click the "Run" button (green triangle) in PyCharm
   - Select "DtComb" configuration
   - Server will start on http://localhost:3838

2. **Method 2: Run run_dev.py**
   - Right-click on `run_dev.py`
   - Select "Run 'run_dev'"
   - This explicitly uses settings from `.env` file

3. **Method 3: Terminal**
   ```bash
   python main.py
   ```

### Troubleshooting

#### Problem: PyCharm still uses port 8000

**Solutions:**
1. Restart PyCharm to reload `.idea/workspace.xml` configuration
2. Manually check Run Configuration:
   - Run → Edit Configurations
   - Select "DtComb"
   - In "Additional options" field, add: `--host 0.0.0.0 --port 3838 --reload`
   - Click OK and restart

#### Problem: Port 3838 already in use

**Solution:**
```powershell
# Find process using port 3838
netstat -ano | findstr :3838

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### Environment Variables

Make sure your `.env` file has:
```env
HOST=0.0.0.0
PORT=3838
DEBUG=False
SECRET_KEY=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
```

### Debugging

To debug with port 3838:
1. Run → Edit Configurations
2. Select "DtComb"
3. Ensure "Additional options" has: `--host 0.0.0.0 --port 3838 --reload`
4. Click the Debug button (bug icon)

### Access Points

After starting:
- **Web UI:** http://localhost:3838
- **API Docs:** http://localhost:3838/docs (if DEBUG=True)
- **Admin Panel:** http://localhost:3838/admin

