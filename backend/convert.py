import uno
import sys
import os

def convert_to_pdf(input_file, output_file):
    # Connect to the UNO bridge on localhost:2002
    local_context = uno.getComponentContext()
    resolver = local_context.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", local_context)
    
    try:
        ctx = resolver.resolve("uno:socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext")
    except Exception as e:
        print("Failed to connect to LibreOffice. Is it running in listening mode?", file=sys.stderr)
        sys.exit(1)
        
    smgr = ctx.ServiceManager
    desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
    
    # Format URLs
    in_url = uno.systemPathToFileUrl(os.path.abspath(input_file))
    out_url = uno.systemPathToFileUrl(os.path.abspath(output_file))
    
    # Load document hidden
    from com.sun.star.beans import PropertyValue
    p = PropertyValue()
    p.Name = "Hidden"
    p.Value = True
    
    # Open Document
    doc = desktop.loadComponentFromURL(in_url, "_blank", 0, (p,))
    if not doc:
        print("Failed to load document.", file=sys.stderr)
        sys.exit(1)
        
    # Save as PDF
    filter_prop = PropertyValue()
    filter_prop.Name = "FilterName"
    filter_prop.Value = "writer_pdf_Export"
    
    doc.storeToURL(out_url, (filter_prop,))
    doc.close(True)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert.py input.docx output.pdf")
        sys.exit(1)
    convert_to_pdf(sys.argv[1], sys.argv[2])
